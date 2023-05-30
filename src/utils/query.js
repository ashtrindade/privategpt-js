const prompt = require('prompt-sync');
let placeholder;
let query;

while (true) {
    query = prompt(placeholder);
    if (query === 'exit') {
        break;
    }
}

module.exports = query;
