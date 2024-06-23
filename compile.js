const fs = require('fs');
const path = require('path');
const {
	compress,
	userscriptWrapper,
	addGMPolyfills,
	addIniter,
	obfuscate,
	bundle,
	fixConsoleOutput
} = require('./compilers');

const AVAILABLE_MODS = {
	DEV: 'dev',
	PROD: 'prod'
}

const NAME = 'PPF dark bot';
const VERSION = path.parse(__dirname).base.replace(/[^\d|\.]/g,'');
const AUTHOR = 'Darkness';
const MODE = process.argv[2];

if(!Object.values(AVAILABLE_MODS).includes(MODE)) {
	throw new Error('undefined bundle mode');
}

(async () => {
	[
		'0_bundle.js',
		'1_bundle.js',
		'2_bundle.js',
		'3_bundle.js',
		'5_b64_bundle.txt',
		'./dist/bundle.js'
	].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));

	let code;
	try {
		code = await bundle('./src/index.ts', MODE === AVAILABLE_MODS.DEV ? 'development' : 'production');
	} catch(e) {
		console.log(e.stderr || e.stdout);
		return;
	}
	console.log('bundled');
	fs.writeFileSync('0_bundle.js', code);

	code = addIniter(code);
	console.log('added initer');
	fs.writeFileSync('1_bundle.js', code);

	code = addGMPolyfills(code);
	console.log('added GM polyfills');
	fs.writeFileSync('2_bundle.js', code);

	if(MODE === AVAILABLE_MODS.DEV) {
		console.log('!!! run in DEV mode !!!');
		code = fixConsoleOutput(code);
		console.log('changed console output to debug');
		fs.writeFileSync('2_bundle.js', code);
	} else {
		console.log('!!! run in PROD mode !!!');
		code = obfuscate(code);
		console.log('obfuscated');
		fs.writeFileSync('2_bundle.js', code);
	}

	const us = userscriptWrapper(code, NAME, VERSION, AUTHOR);
	console.log('added to userscript');
	fs.writeFileSync('3_bundle.js', us);

	console.log('made b64');
	fs.writeFileSync('5_b64_bundle.txt', compress(code));	

	console.log('Complete');
})();