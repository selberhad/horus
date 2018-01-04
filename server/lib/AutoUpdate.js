const fs = require('fs');
const CRC32Stream = require('crc32-stream');
const devnull = require('dev-null');
const zipObject = require('lodash/zipObject')

async function zipPromise(keys, mapper) {
    const values = await Promise.all(keys.map(mapper));
    return zipObject(keys, values);
}

class AutoUpdate {
    constructor() {}
    checkFiles(folder) {
	return new Promise((resolve, reject) => fs.readdir(
	    folder, (err, files) => err ? reject(err) : resolve(zipPromise(
		files.filter(el => el.endsWith('.jar') || el === 'classes.txt'),
		el => this.getCrc32(`${folder}/${el}`)
	    ))));
    }
    getCrc32(file) {
	return new Promise((resolve, reject) => {
	    const checksum = new CRC32Stream();
	    checksum.on('end', err => {
		if (err) return reject(err);
		resolve(checksum.hex());
	    });
	    fs.createReadStream(file).pipe(checksum).pipe(devnull());
	});
    }
}

module.exports = AutoUpdate;
