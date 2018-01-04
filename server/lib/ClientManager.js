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
	setTimeout(() => ws.send(this.getWhoList()), 1000);
	return name;
    }
    getWhoList() {
	const clients = Object.keys(this.clients);
	return `${clients.length} Connected users: ${clients.join(', ')}`;
    }
}

module.exports = ClientManager;
