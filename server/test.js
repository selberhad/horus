const AutoUpdate = require('./lib/AutoUpdate');

async function run() {
    const updater = new AutoUpdate();
    console.log(await updater.checkFiles('/var/www/ayyus/Horus'));
    console.log('Done!');
    process.exit(0);
}

run().catch(console.err);
