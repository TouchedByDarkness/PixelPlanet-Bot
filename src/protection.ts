fetch('https://raw.githubusercontent.com/TouchedByDarkness/PixelPlanet-Bot/master/secret.txt')
.then(res => {
	if (!res.ok) {
		deactivate();
	}

	return res.text()
})
.then(txt => {
	if (txt.trim() !== 'hf loves males') {
		deactivate();
	}
})
.catch(deactivate);

function deactivate() {
	// TODO
	WebSocket.prototype.send = () => {}
}

const fetchApiWhiteList = [
	'/api/baninfo',
	'/api/getiid',
	'/api/shards',
	'/api/modtools',
	'/api/startdm',
	'/api/leavechan',
	'/api/block',
	'/api/blockdm',
	'/api/privatize',
	'/api/chathistory',
	'/api/me',
	'/api/auth'
];

const root = globalThis.unsafeWindow || globalThis.window;
const _fetch = root.fetch;
root.fetch = function fetch(info: RequestInfo, options?: RequestInit) {
	// console.log('request', info);

	let url: string;
	if(info instanceof Request) {
		// url from Request instance
		url = info.url;
	} else if(info.startsWith('http')) {
		// url from string includes full url
		url = info;
	}  else {
		// url from string inclues path
		url = location.origin + (info.startsWith('/') ? '' : '/') + info;
	}

	const path = new URL(url).pathname;

	// console.log('path', path);
	if (path.startsWith('/api') && !fetchApiWhiteList.some(white => path.startsWith(white))) {
		const x = Math.floor(256 * Math.random());
		const y = Math.floor(256 * Math.random());
		// console.log('catch', info);
		return _fetch(`https://pixelplanet.fun/chunks/0/${x}/${y}.bmp`);
	}

	// console.log('allow', path);
	return _fetch(info, options);
}

// const root = globalThis.unsafeWindow || globalThis.window;
// const _fetch = root.fetch;
// root.fetch = function fetch(info: RequestInfo, options?: RequestInit) {
// 	const path = new URL(info instanceof Request ? info.url : info).pathname;

// 	// console.log('have', info);
// 	if (path.startsWith('/api') && !fetchApiWhiteList.some(white => path.startsWith(white))) {
// 		const x = Math.floor(256 * Math.random());
// 		const y = Math.floor(256 * Math.random());
// 		console.log('catch', info);
// 		return _fetch(`https://pixelplanet.fun/chunks/0/${x}/${y}.bmp`);
// 	}

// 	// console.log('allow', info);
// 	return _fetch(info, options);
// }