const glob = require('glob');
const fs = require('fs');
const path = require('path');
const { Pool } = require('node-multiprocess');
const { Chroma } = require('langchain/vectorstores/pinecone');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { HuggingFaceInferenceEmbeddings } = require('langchain/embeddings/hf');
const { CSVLoader } = require('langchain/document_loaders/fs/csv');
const { TextLoader } = require('langchain/document_loaders/fs/text');
const { UnstructuredLoader } = require('langchain/document_loaders/fs/unstructured');

const persistDirectory = 'db';
const embeddingsModelName = 'all-MiniLM-L6-v2';
const sourceDirectory = '../trainingData';
const chunkSize = 500;
const chunkOverlap = 50;

class MyElmLoader extends UnstructuredLoader {
    async load() {
        let doc;

        try {
            try {
                doc = await super.load();
            } catch (e) {
                if (e.message.includes('text/html content not found in email')) {
                    this.unstructured_kwargs['content_source'] = 'text/plain';
                    doc = await super.load();
                } else {
                    throw e;
                }
            }
        } catch (e) {
            throw new e.constructor(`${this.filePath}: ${e.message}`);
        }

        return doc;
    }
}

const loaderMapping = {
    '.csv': [CSVLoader, {}],
    '.eml': [MyElmLoader, {}],
    '.txt': [TextLoader, { encoding: 'utf8' }]
};

function loadSingleDocument(filePath) {
    let ext = '.' + filePath.split('.').pop();
    if (ext in loaderMapping) {
        let [loaderClass, loaderArgs] = loaderMapping[ext];
        let loader = new loaderClass(filePath, ...loaderArgs);
        return loader.load()[0];
    }

    throw new Error(`Unsupported file extension '${ext}'`);
}

function loadDocuments(sourceDir, ignoredFiles = []) {
    let allFiles = [];
    for (let ext in loaderMapping) {
        allFiles.push(...glob.sync(`${sourceDir}/**/*${ext}`, { nodir: true }));
    }
    let filteredFiles = allFiles.filter((filePath) => !ignoredFiles.includes(filePath));

    let results = [];
    const pool = new Pool(4);

    let docs = pool.addJob(loadSingleDocument, filteredFiles);

    for (let i = 0; i < docs.length; i++) {
        let doc = docs[i];
        results.push(doc);
    }

    pool.kill();

    return results;
}

function processDocuments(ignoredFiles = []) {
    console.log(`Loading documents from ${sourceDirectory}`);
    let documents = loadDocuments(sourceDirectory, ignoredFiles);
    if (documents.length === 0) {
        console.log('No new documents to load');
        process.exit(0);
    }
    console.log(`Loaded ${documents.length} new documents from ${sourceDirectory}`);
    let textSplitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
    let texts = textSplitter.splitDocuments(documents);
    console.log(`Split into ${texts.length} chunks of text (max. ${chunkSize} tokens each)`);
    return texts;
}

function doesVectorstoreExist(persistDirectory) {
    if (fs.existsSync(path.join(persistDirectory, 'index'))) {
        if (
            fs.existsSync(path.join(persistDirectory, 'chroma-collections.parquet')) &&
            fs.existsSync(path.join(persistDirectory, 'chroma-embeddings.parquet'))
        ) {
            let listIndexFiles = glob.sync(path.join(persistDirectory, 'index/*.bin'));
            listIndexFiles.push(...glob.sync(path.join(persistDirectory, 'index/*.pkl')));
            if (listIndexFiles.length > 3) {
                return true;
            }
        }
    }
    return false;
}

function ingest() {
    let embeddings = new HuggingFaceInferenceEmbeddings({ modelName: embeddingsModelName });
    let db;

    if (doesVectorstoreExist(persistDirectory)) {
        console.log(`Appending to existing vectorstore at ${persistDirectory}`);

        db = new Chroma({
            persistDirectory,
            embeddingFunction: embeddings,
            clientSettings: {
                chromaDbImpl: 'duckdb+parquet',
                anonymizedTelemetry: false
            }
        });
        let collection = db.get();
        let texts = processDocuments(collection['metadatas'].map((metadata) => metadata['source']));

        console.log('Creating embeddings. May take some minutes...');

        db.addDocuments(texts);
    } else {
        console.log('Creating new vectorstore');

        let texts = processDocuments();

        console.log('Creating embeddings. May take some minutes...');

        db = Chroma.fromDocuments(texts, embeddings, {
            persistDirectory,
            clientSettings: {
                chromaDbImpl: 'duckdb+parquet',
                anonymizedTelemetry: false
            }
        });
    }
    db.persist();
    db = null;

    console.log('Ingestion complete! You can now run privateGPT.py to query your documents');
}

ingest();
