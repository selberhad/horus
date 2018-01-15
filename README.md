# Horus

## Group chat plugin for UMC/Nodeka

### Installation

Download from here: [http://ayyus.com/horus-0.0.4.zip](http://ayyus.com/horus-0.0.4.zip)

Extract into UMC/plugins folder.

Create "horus.json" file in UMC folder containing, substituting in your name:

```
{
  "name": "YourName",
  "server": "ws://ayyus.com:5511"
}
```

Reload Plugins or restart UMC.

### Current Features

#horus is used in these examples, but #och also works

#### `@` commands

Can be used at all time.

> `#horus @connect`
> 
> `#horus @config show`
> 
> `#horus @config set [property] [value]`
> 
> Current supported properties are `name` (your character name) and `promptLines` (the number of lines in your prompt, default is 2).
> 
> `#horus @config save`
> 
> `#horus @quit`

#### `/` commands

Can only be used when you're connected to the chat server.

> `#horus /who`
> 
> `#horus /pm [name] [message]`

Auto-updates - on by default, added in 0.0.3. Set `"autoUpdate": false` in horus.json to turn off.

Debug mode - off by default, turn on if you have issues so you can send me the logs. Set `"debug": true` in horus.json to turn on.

### Slack Integration

Details tba

### Planned Features

Custom/private channels

Authentication

HP/PvP features from OChat

### Known Issues

Reloading plugins causes double echo. Restart UMC to fix.
