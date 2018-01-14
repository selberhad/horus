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

ws.on('close', () => console.log('--- closed ---'));

ws.on('error', err => {
    console.log('General error:');
    console.error(err);
});

rl.on('line', (input) => {
    ws.send(input, err => {
	if (!err) return;
	console.log('Error sending:');
	console.error(err)
    });
});
