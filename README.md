
# Epigenetic Data Translator

## Overview
This Node.js application translates epigenetic data, specifically methylation patterns, by mapping CpG identifiers to genomic positions. It utilizes MongoDB for data storage and the UCSC Genome Browser API for additional data retrieval.

## Prerequisites
- Node.js
- MongoDB
- A `.env` file with your MongoDB URI

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ClaraGarciaAcademicProfile/Epigenomics-Data-Translator.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Epigenomics-Data-Translator
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Setting Up
Create a `.env` file in the project root with your MongoDB URI:
```
MONGO_URI=your_mongodb_uri_here (la que comparti en el documento de word)
```

## Running the Application
To run the application, execute:
```bash
npm start
```

## Data Format
The input data should be in a file named `archive.txt` with CpG identifiers and corresponding values, separated by tabs.

## Output
The translated data will be saved to `archive-translated.txt`.

## Note
Ensure that the MongoDB database and collections are set up as per the script requirements. The script is configured for a database named `epigenetic_data` and a collection named `methylation_data`.

## Contribution
Feel free to fork, modify, and make pull requests to this repository. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)
