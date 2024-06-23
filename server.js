const fs = require('fs');
const http = require('http');
const { compileUserscriptBody, addAntiban, addAppCreation } = require('./src/compilers.js');
const Emitter = require('events');

const emitter = new Emitter();

let compiling = false;
http.createServer(async (req, res) => {
	if('origin' in req.headers) {
		res.setHeader('Access-Control-Allow-Origin', req.headers['origin']);
	}

	console.log(new Date(),'request');
	if(!compiling) {
		compiling = true;
		compileUserscriptBody('dev').then(code => {
			emitter.emit('code', addAppCreation(addAntiban(code)));
			compiling = false;
		});
	}
	const cb = code => {
		res.write(code);
		res.end();
		emitter.off('code', cb);
	}
	emitter.on('code', cb);
})
.on('listening', () => console.log('server started'))
.listen(80);