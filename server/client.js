const WebSocket = require('ws');

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ws = new WebSocket('ws://localhost:5511', {headers: {
    'Authorization': process.argv[2] || 'Horus'
}});

ws.on('open', function open() {
    console.log('-- open --');
});

ws.on('message', function incoming(data) {
    console.log(data);
});


rl.on('line', (input) => {
    ws.send(input);
});
