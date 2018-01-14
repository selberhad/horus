const EventEmitter = require('events');
const express = require('express');
const bodyParser = require('body-parser');
const slack = require('slack');
const token = process.env.SLACK_BOT_TOKEN;
const scopes = 'client,rtm:stream';
const dump = obj => console.dir(obj, {colors: true, depth: null});

class SlackListener extends EventEmitter {
    constructor() {
	super();
	this.userNameLookup = require('../slackUsers.local');
	this.channelLookup = {
	    C8PUUV4DC: '#chat'
	};
    }
    start(port) {
	return new Promise(resolve => {
	    const app = this.app = express();
	    app.use(bodyParser.json());
	    app.post('/slack/event', (req, res) => {
		if (req.body.challenge) return res.send(req.body.challenge);
		if (req.body.event) {
		    this.emitEvent(req.body.event);
		}
		res.status(200).end();
	    });
	    app.listen(port, () => resolve(app));
	});
    }
    postMessage(text) {
	slack.chat.postMessage({token, text, channel: 'C8PUUV4DC'});
    }
    emitEvent(event) {
	const {
	    user,
	    type,
	    text,
	    channel,
	    ts,
	    event_ts
	} = event;
	const userName = this.userNameLookup[user];
	if (!userName) {
	    console.log(`Unrecognized Slack userId: ${user}`);
	    return;
	}
	const channelName = this.channelLookup[channel];
	const ev = {
	    user, userName,
	    channel, channelName,
	    text, ts
	};
	dump(ev);
	this.emit(type, ev);
    }
}

module.exports = SlackListener;
	 
