require('dotenv').config()

const WebSocket = require('ws');
const ClientManager = require('./lib/ClientManager');
const SlackBot = require('./lib/SlackBot');

const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
const channelPrefix = chalk.red('<< ') + chalk.white('Misfits') + chalk.red(' >> ');

const port = process.argv[2] || 5511;
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

process.on('SIGINT', () => {
    console.log('Caught interrupt signal');
    wss.broadcast('Server rebooting!');
    process.exit();
});

run().catch(console.error);

async function run() {

    const slackBot = await startSlackBot(process.argv[3] || 7543)
    slackBot.on('message', ({userName, text, channelName, ts}) => {
	switch (channelName) {
	case '#chat':
	    wss.broadcast(formatMessage(`${userName} via slack`, text));
	    break;
	default:
	    console.log({slackBot: {userName, text, channelName}});
	    break;
	}
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
    manager.on('disconnect', name => wss.broadcast(`${name} disconnected.`));
    
    manager.on('message', ({name, message}) => {
	if (!message.length) return;
	const client = manager.clients[name].ws;
	if (message.startsWith('/')) {
	const [command, params] = splitFirstWord(message);
	    manager.handleCommand(client, name, command, params);		      
	} else {
	    slackBot.postMessage(stripAnsi(formatMessage(name, message)));
	    wss.sendFrom(client, {name, message});
	}
    });
    
    console.log(`Websocket server listening on port ${port}`);
    
}

function splitFirstWord(message) {
    const [first] = message.split(' ', 1);
    return [first, message.substring(first.length+1)];
}
	   
function ucFirst(string) {
    return string[0].toUpperCase() + string.substring(1);
}

function formatMessage(from, message) {
    return channelPrefix + chalk.bold.white(from) + chalk.red(': ') + message;
}

function sendMessage(client, from, message) {
    client.send(formatMessage(from, message));
    //console.log('Message relayed', {from, message});
}

async function startSlackBot(listenerPort) {
    const slackBot = new SlackBot();
    await slackBot.start(listenerPort);
    console.log(`SlackBot up on ${listenerPort}`);
    return slackBot;
}
