const EventEmitter = require('events');

const AutoUpdate = require('./AutoUpdate');
const updater = new AutoUpdate();

const chalk = require('chalk');
let g = x => chalk.gray(x);
let r = x => chalk.red(x);
let c = x => chalk.cyan(x);

class ClientManager extends EventEmitter {
    constructor() {
	super();
	this.clients = {};
    }
    async add(ws, req) {
	const name = req.headers.authorization;
	if (!name) {
	    ws.send('Connection failed; need to provide a name');
	    return;
	}
	const ip = req.connection.remoteAddress.split(':').pop();
	console.log(`${name} connected from ${ip}`);
	this.clients[name] = {ws, req};
	ws.send('\u1234Checksums\u1234' + JSON.stringify({checksums: await updater.checkFiles('/var/www/ayyus/Horus')}));
	ws.on('message', message => this.emit('message', {name, message}));
	[ c('| ') + g('  __.-=-. ') +   '           '  + g(' .-=-.__  ') + c(' | ') + `Welcome, ${chalk.yellow.bold(name)}!`,
	  c('| ') + g('  --<(*)> ') + r(' h o r u s ') + g(' <(*)>--  ') + c(' | ') + chalk.magenta(ip),
	  c('| ') + g("*.__.'|   ") +   '           '  + g("   |'.__.*") + c(' | ') + chalk.magenta(new Date().toISOString())
	].forEach(line => ws.send(line));
	ws.on('close', () => {
	    delete this.clients[name];
	    this.emit('disconnect', name);
	});
	ws.on('error', (err) => console.error(err));
	setTimeout(() => ws.send(this.getWhoList()), 1000);
	return name;
    }
    handleCommand(client, name, command, args) {
	switch (command.toLowerCase()) {
	case "/pm":
	    let [to, message] = splitFirstWord(args);
	    to = ucFirst(to);
	    const recip = this.clients[to];
	    if (!recip) return client.send(`${to} isn\'t on.`);
	    client.send(`<< to: ${to} >>: ${message}`);
	    recip.ws.send(`<< from: ${name} >>: ${message}`);
	    break;
	case "/who":
      	    client.send(this.getWhoList());
	    break;
	default:
	    client.send(`Command not found: ${command}`);
	    console.log({handleCommand: {name, command, args}});
	}
    }
    getWhoList() {
	const clients = Object.keys(this.clients);
	return `${clients.length} Connected users: ${clients.join(', ')}`;
    }
}

module.exports = ClientManager;
