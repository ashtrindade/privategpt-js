const { RetrievalQA } = require('langchain/chains');
const { HuggingFaceEmbeddings } = require('langchain/embeddings/hf');
const { StreamingStdOutCallbackHandler } = require('langchain/callbacks/streaming_stdout');
const { GPT4All } = require('langchain/llms');
const { Chroma } = require('langchain/vectorstores/pinecone');
const parseArguments = require('./src/utils/parseArguments');
const prompt = require('prompt-sync')();
const args = parseArguments();

const embeddings = new HuggingFaceEmbeddings({
    model: process.env.EMBEDDINGS_MODEL_NAME
});

const db = new Chroma({
    persistDirectory: 'db',
    embeddingFunction: embeddings,
    chromaDbImpl: 'duckdb+parquet',
    anonymizedTelemetry: false
});
const retriever = db.asRetriever();
const callbacks = args.muteStream ? [] : [new StreamingStdOutCallbackHandler()];

const llm = new GPT4All({
    model: process.env.MODEL_PATH,
    n_ctx: process.env.MODEL_N_CTX,
    backend: 'gptj',
    callbacks: callbacks,
    verbose: false
});
let qa = RetrievalQA.from_chain_type({
    llm: llm,
    chainType: 'stuff',
    retriever: retriever,
    returnSourceDocuments: !args.hideSource
});

let query;

while (true) {
    query = prompt('\nEnter a query: ');
    if (query === 'exit') {
        break;
    }
}

let res = qa(query);
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
