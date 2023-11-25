const fs = require("fs");
const axios = require("axios");
const promiseLimit = require("promise-limit");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config();

const limit = promiseLimit(5);

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect(async (err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  }

  const database = client.db("epigenetic_data");
  const valuesCollection = database.collection("methylation_data");
  const translationDict = {};

  async function populateTranslationDictFromDB() {
    const values = await valuesCollection.find({}).toArray();
    for (const value of values) {
      translationDict[value.cpgId] = value.translation;
    }
  }

  async function populateTranslationDictFromAPI(
    valuesToTranslate,
    translationValue
  ) {
    for (const value of valuesToTranslate) {
      if (!translationDict[value]) {
        try {
          const existingValue = await valuesCollection.findOne({ cpgId: value });
  
          if (!existingValue) {
            const response = await axios.get(
              `https://api.genome.ucsc.edu/search?search=${value}&genome=hg38`
            );
            const matches =
              response.data["positionMatches"][0]["matches"][0]["position"];
            const formattedMatches = matches.replace(/[:-]/g, "\t");
  
            const dbValueToInsert = `${formattedMatches}`;
  
            await valuesCollection.insertOne({
              cpgId: value,
              translation: dbValueToInsert,
            });
  
            translationDict[value] = dbValueToInsert;
            fs.appendFileSync(
              "archive-translated.txt",
              `${dbValueToInsert}\t${value}\t${translationValue}\n`,
              "utf-8"
            );
          } else {
            translationDict[value] = existingValue.translation;
          }
        } catch (error) {
          console.error(
            `Error obteniendo datos para ${value}: ${error.message}`
          );
          translationDict[value] = ""; 
        }
      }
    }
  }  

  fs.readFile("archive.txt", "utf-8", async (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    const lines = data.trim().split("\n");
    const errors = [];

    const processedLines = [];

    for (const line of lines) {
      const [cpgId, secondColumn] = line.split("\t");

      if (!cpgId || !secondColumn || !cpgId.startsWith("cg")) {
        console.error(`Línea ignorada debido a formato incorrecto: ${line}`);
        continue;
      }

      let translationValue;
      const methylationDegree = parseFloat(secondColumn);
      if (methylationDegree) {
        if (!isNaN(methylationDegree)) {
          translationValue = methylationDegree;
        } else {
          null
        }
      }

      await populateTranslationDictFromAPI([cpgId], translationValue);

      const dbValueFromDict = translationDict[cpgId];

      if (translationValue && translationValue !== undefined) {
        if (dbValueFromDict) {
          processedLines.push(`${dbValueFromDict}\t${cpgId}\t${translationValue}`);
        }
      } else {
        console.error(
          `Línea ignorada debido a valor no traducido o incorrecto: ${line}`
        );
      }
    }

    await populateTranslationDictFromDB();

    const output = processedLines.join("\n");

    fs.writeFileSync(
      "archive-translated.txt",
      output,
      "utf-8"
    );

    if (errors.length > 0) {
      console.error("Errores acumulados:");
      errors.forEach(({ cpgId, error }) => {
        console.error(`Error para ${cpgId}: ${error.message}`);
      });
    }
  });
});
