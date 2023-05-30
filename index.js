const { BaseChain } = require('langchain/chains');
const { Embeddings } = require('langchain/embeddings/base');
const { BaseCallbackHandler } = require('langchain/callbacks');
const { LLM } = require('langchain/llms/base');
const { VectorStore } = require('langchain/vectorstores/base');
const parseArguments = require('./src/utils/parseArguments');
const prompt = require('prompt-sync');

let args = parseArguments();

const embeddings = new Embeddings({
    model: 'all-MiniLM-L6-v2'
});

const db = new VectorStore({
    persistDirectory: 'db',
    embeddingFunction: embeddings,
    chromaDbImpl: 'duckdb+parquet',
    anonymizedTelemetry: false
});
const retriever = db.asRetriever();
const callbacks = args ? [] : [new BaseCallbackHandler()];

const llm = new LLM({
    model: process.env.MODEL_PATH,
    n_ctx: process.env.MODEL_N_CTX,
    backend: 'gptj',
    callbacks: callbacks,
    verbose: false
});
let chain = new BaseChain({
    llm: llm,
    chainType: 'stuff',
    retriever: retriever,
    returnSourceDocuments: !args
});

let query;
while (true) {
    query = prompt()();
    if (query === 'exit') {
        break;
    }
}

let res = chain(query);
let answer = res['result'];
let docs = args.hide_source ? [] : res['source_documents'];

console.log('\n\n> Question:');
console.log(query);
console.log('\n> Answer:');
console.log(answer);

for (let document of docs) {
    console.log('\n> ' + document.metadata['source'] + ':');
    console.log(document.page_content);
}
