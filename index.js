// eslint-disable-next-line no-unused-vars
const gpt4all = require('gpt4all');
const parseDocuments = require('./src/utils/parseDocuments');
const { HuggingFaceInferenceEmbeddings } = require('langchain/embeddings/hf');
const { Chroma } = require('langchain/vectorstores');

const args = parseDocuments();

const embedings = new HuggingFaceInferenceEmbeddings({
    model: process.env.EMBEDDINGS_MODEL_NAME
});

const db = new Chroma(embedings, args);

// eslint-disable-next-line no-unused-vars
const retriever = db.asRetriever();
