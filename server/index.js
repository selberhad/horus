const WebSocket = require('ws');
const ClientManager = require('./lib/ClientManager');

const chalk = require('chalk');
const channelPrefix = chalk.red('<< ') + chalk.white('Misfits') + chalk.red(' >> ');

const port = 5511;
const wss = new WebSocket.Server({ port });

wss.broadcast = data => wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(data);
});

wss.broadcastOthers = (ws, data) => wss.clients.forEach(client => {
    if (client === ws || client.readyState !== WebSocket.OPEN) return;
    client.send(data);
});

wss.sendFrom = (ws, data) => wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;
    let name = 'You';
    if (client !== ws) {
	if (data.name) {
	    name = data.name;
	} else {
	    name = 'Unknown';
	}
    }
    sendMessage(client, name, data.message);
});

const manager = new ClientManager(wss);
wss.on('connection', async (ws, req) => {
    const name = await manager.add(ws, req);
    if (name) {
	wss.broadcastOthers(ws, `${name} joined!`);
    } else {
	console.log('Client didnt provide a name');
    }
});
manager.on('message', ({name, message}) => {
    const client = manager.clients[name].ws;
    if (message.startsWith('/')) {
	const [command, params] = splitFirstWord(message);
	handleCommand(client, name, command, params);		      
    } else {
	wss.sendFrom(client, {name, message});
    }
    });

process.on('SIGINT', () => {
    console.log('Caught interrupt signal');
    wss.broadcast('Server rebooting!');
    process.exit();
});

console.log(`Listening on port ${port}`);

function splitFirstWord(message) {
    const [first] = message.split(' ', 1);
    return [first, message.substring(first.length+1)];
}
	   
function ucFirst(string) {
    return string[0].toUpperCase() + string.substring(1);
}

function sendMessage(client, from, message) {
    client.send(channelPrefix + chalk.bold.white(from) + chalk.red(': ') + message);
    console.log('Message relayed', {from, message});
}

function handleCommand(client, name, command, args) {
    switch (command.toLowerCase()) {
    case "/pm":
	let [to, message] = splitFirstWord(args);
	to = ucFirst(to);
	const recip = manager.clients[to];
	if (!recip) return client.send(`${to} isn\'t on.`);
	client.send(`<< to: ${to} >>: ${message}`);
	recip.ws.send(`<< from: ${name} >>: ${message}`);
	break;
    case "/who":
      	client.send(manager.getWhoList());
	break;
    default:
	client.send(`Command not found: ${command}`);
	console.log({handleCommand: {name, command, args}});
    }
}
