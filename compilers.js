const vm = require('vm');
const fs = require('fs');
const util = require('util');
const child_process = require('child_process');
const obfuscator = require('javascript-obfuscator');
const rimraf = require('rimraf');

const removeFolder = util.promisify(rimraf);

const exec = util.promisify(child_process.exec);

module.exports.compress = str => {
	const ctx = vm.createContext();
	vm.runInContext(fs.readFileSync('./lz-string.min.js').toString(), ctx);
	return ctx.base64.encode(str);
}

module.exports.userscriptWrapper = (code, name, version, author) => {
	const b64 = module.exports.compress(code);
	const parts = [];
	for (let i = 0, step = 200; i < b64.length; i+=step) {
		parts.push(b64.slice(i, Math.min(i + step, b64.length)));
	}

	return [
		'// ==UserScript==',
		'// @name         ' + name,
		'// @version      ' + version,
		'// @author       ' + author,
		'// @grant 		 GM_xmlhttpRequest',
		'// @grant 		 unsafeWindow',
		'// @require		 https://raw.githubusercontent.com/mitchellmebane/GM_fetch/master/GM_fetch.min.js',
		'// @connect		 githubusercontent.com',
		'// @connect		 github.com',
		'// @connect		 glitch.me',
		'// @connect		 pixelplanet.fun',
		'// @connect		 fuckyouarkeros.fun',
		'// @description     Make us great again!',
		'// @match      *://pixelplanet.fun/*',
		'// @match      *://fuckyouarkeros.fun/*',
		'// ==/UserScript==',
		'',
		fs.readFileSync('./lz-string.min.js').toString(),
		'',
		'const bytecode = (',
		parts.map(p => `\t"${p}"`).join(' +\n') + ');',
		'',
		'new Function("const [self, GM, unsafeWindow] = arguments; " + atob(bytecode))(self, GM, unsafeWindow);'
	].join('\n');
}

module.exports.addGMPolyfills = code => [
	'const fetch = function() {',
		'if (arguments[0].includes("pixelplanet.fun") || arguments[0].includes("fuckyouarkeros.fun")) {',
			'return unsafeWindow.fetch.apply(null, arguments);',
		'} else {',
			'return self.GM_fetch(...arguments);',
		'}',
	'}',
	'const WebSocket = self.WebSocket;',
	'',
	code
].join('\n');

module.exports.addIniter = code => [
	'function payload() {',
		code,
	'}',
	'',
	'(function checkAndRun() {',
		'console.log("checking...");',
		'if (document.readyState === "complete" &&',
			'document.querySelector("canvas") &&',
			'document.querySelector(".coorbox")',
		') {',
			'console.log("run bot");',
			'payload();',
		'} else {',
			'setTimeout(checkAndRun, 100);',
		'}',
	'})()',
].join('\n');

module.exports.obfuscate = code => obfuscator.obfuscate(code, {
	optionsPreset: 'low-obfuscation',
	identifierNamesGenerator: 'mangled-shuffled'
	// compact: true,
	// simplify: true,
	// selfDefending: true,
	// identifierNamesGenerator: 'hexadecimal',
	// controlFlowFlattening: true
}).getObfuscatedCode();

module.exports.bundle = async (entry, mode = 'production') => {
	const out = './dist';
	if (fs.existsSync(out)) {
		// fs.unlinkSync(out);
		removeFolder(out);
	}

	return exec(`npx webpack --entry "${entry}" -o "${out}" --mode "${mode}"`)
		.then(() => fs.readFileSync(out + '/main.js').toString());
}

module.exports.fixConsoleOutput = code => [
	'const console = {',
		'log: window.console.debug,',
		'warn: window.console.debug,',
		'debug: window.console.debug,',
		'error: window.console.debug,',
		'trace: window.console.trace',
	'}',
	'window.addEventListener(\'error\', console.debug);',
	'',
	code
].join('\n');