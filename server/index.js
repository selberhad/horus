require('dotenv').config();

const WebSocket = require('ws');
const ClientManager = require('./lib/ClientManager');
const SlackBot = require('./lib/SlackBot');

const chalk = require('chalk');
const stripAnsi = require('strip-ansi');
const channelPrefix =
  chalk.red('<< ') + chalk.white('Misfits') + chalk.red(' >> ');

const { ucFirst, splitFirstWord } = require('./lib/common');

const port = process.argv[2] || 5511;
const wss = new WebSocket.Server({
  port
});

wss.broadcast = data =>
  wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;
    client.send(data);
  });

wss.broadcastOthers = (ws, data) =>
  wss.clients.forEach(client => {
    if (client === ws || client.readyState !== WebSocket.OPEN) return;
    client.send(data);
  });

wss.sendFrom = (ws, data) =>
  wss.clients.forEach(client => {
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

wss.on('error', error => console.error(error));

wss.on('listening', () =>
  console.log(`Websocket server listening on port ${port}`)
);

process.on('SIGINT', () => {
  console.log('Caught interrupt signal');
  wss.broadcast('Server rebooting!');
  process.exit();
});

run().catch(console.error);

async function run() {
  const manager = new ClientManager(wss);

  const slackBot = await startSlackBot(process.argv[3] || 7543);
  slackBot.on('message', ({ userName, text, channelName, ts }) => {
    if (!channelName) {
      console.log(`SlackBot: PM from ${userName}: ${text}`);
      if (manager.clients[userName]) {
        manager.clients[userName].ws.send(`\u1234Remote\u1234${text}`);
        return;
      }
      console.log(`${userName} not currently connected`);
      return;
    }
    switch (channelName) {
      case '#chat':
        wss.broadcast(formatMessage(`${userName} via slack`, text));
        break;
      default:
        console.log({ slackBot: { userName, text, channelName } });
        break;
    }
  });

  wss.on('connection', async (ws, req) => {
    const name = await manager.add(ws, req);
    if (name) {
      wss.broadcastOthers(ws, `${name} joined!`);
    } else {
      console.log('Client didnt provide a name');
    }
  });
  manager.on('disconnect', name => wss.broadcast(`${name} disconnected.`));

  manager.on('message', ({ name, message }) => {
    if (!message.length) return;
    const client = manager.clients[name].ws;
    if (message.startsWith('/')) {
      const [command, params] = splitFirstWord(message);
      manager.handleCommand(client, name, command, params);
    } else {
      slackBot.postMessage(stripAnsi(formatMessage(name, message, true)));
      wss.sendFrom(client, { name, message });
    }
  });
}

function formatMessage(from, message, slack = false) {
  let prefix = channelPrefix + chalk.bold.white(from) + chalk.red(':');
  if (slack) prefix = '`' + prefix + '`';
  return prefix + ' ' + message;
}

function sendMessage(client, from, message) {
  client.send(formatMessage(from, message));
  //console.log('Message relayed', {from, message});
}

async function startSlackBot(listenerPort) {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.log('No SLACK_BOT_TOKEN found, skipping Slack integration');
    return false;
  }
  const slackBot = new SlackBot();
  await slackBot.start(listenerPort);
  console.log(`SlackBot up on ${listenerPort}`);
  return slackBot.on('message', ({ userName, text, channelName, ts }) => {
    switch (channelName) {
      case '#chat':
        wss.broadcast(formatMessage(`${userName} via slack`, text));
        break;
      default:
        console.log({
          slackBot: {
            userName,
            text,
            channelName
          }
        });
        break;
    }
  });
}
