const { ArgumentParser } = require('argparse')
const parser = new ArgumentParser({
    description: 'privateGPT: Ask questions to your documents without an internet connection'
})

function parseDocuments() {
    parser.add_argument(
        '--hide-source',
        '-S',
        { action: 'store_true' },
        { help: 'Use this flag to disable printing of source documents used for answers.' }
    )

    parser.add_argument(
        '--mute-stream',
        '-M',
        { action: 'store_true' },
        { help: 'Use this flag to disable the streaming StdOut callback for LLMs.' }
    )
}

module.exports = parseDocuments
