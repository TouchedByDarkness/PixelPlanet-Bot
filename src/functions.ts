import { CANVASES, /*CanvasAPI, fakeFrom*/ } from './CanvasAPI'
import { ITargeter, SortingTargeter } from './Targeter'

export const between = (min: number, x: number, max: number): boolean => x > min && x < max;

export const antialiasing = (ctx: CanvasRenderingContext2D, bool: boolean) => ctx.imageSmoothingEnabled = bool;

export const notify = (title: string, options?: NotificationOptions) => {
	if ('Notification' in window) {
		if (Notification.permission === 'granted') {
			new Notification(title, options);
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission(perm => perm === "granted" && new Notification(title, options));
		}
	}
}

export type mkOptions = Partial<{
	id: string
	class: string
	style: string
	text: string
	html: string
	breakText: boolean
	shadow: boolean
	attributes: Record<string, string>
	listeners: Record<string, EventListener>
}>

export const mk = <T extends keyof HTMLElementTagNameMap>(type: T, options?: mkOptions, childs: Array<HTMLElement> = []) => {
	const e: HTMLElementTagNameMap[T] = document.createElement(type);

	if (!options) {
		return e;
	}

	if (options.id) {
		e.setAttribute('id', options.id);
	}
	
	if (options.class) {
		e.setAttribute('class', options.class);
	}

	if (options.style) {
		e.setAttribute('style', options.style);
	}

	if (options.html) {
		e.innerHTML = options.html;
	} else if (options.text) {
		if (options.breakText) {
			e.innerText = confuseString(options.text);
		} else {
			e.innerText = options.text;
		}
	}

	if (options.listeners) {
		Object.entries(options.listeners).forEach(([event, handler]) => {
			if (event.startsWith('on')) {
				e.addEventListener(event.substring(2), handler);
			} else {
				e.addEventListener(event, handler);
			}
		});
	}

	if (options.attributes) {
		Object.entries(options.attributes)
			.forEach(([name, value]) => e.setAttribute(name, value));
	}

	if (options.shadow) {
		e.attachShadow({ mode: 'open' });
	}

	if (childs.length !== 0) {
		const root = e.shadowRoot || e;
		childs.forEach(child => root.appendChild(child));
	}

	return e;
}

// export const getValue = (e: Event) => {
// 	if(e.target instanceof Element && 'value' in e.target) {
// 		return e.target.value;
// 	}
// }

export const downloadCanvas = (canvas: HTMLCanvasElement, name = 'unnamed') => {
	const link = document.createElement('a');
	link.href = canvas.toDataURL('image/png');
	link.download = name;
	link.click();
}

export const $ = (sel: string) => document.querySelector(sel);

export const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
	const img = new Image();
	img.crossOrigin = '';
	img.onload = () => resolve(img);
	img.onerror = reject;
	img.src = src;
});

export const rand = (min: number, max: number) => Math.round(min - 0.5 + Math.random() * (max - min + 1));

// export const fetchApiMe = () => makeAPIGETRequest('/me');

// module.exports.getModList = async callback => {
// 	const data = new FormData();
// 	data.append('modlist', true);
// 	const resp = await fetch(`${shardOrigin}/api/modtools`, {
// 	credentials: 'include',
// 	method: 'POST',
// 	body: data,
// 	});
// 	if (resp.ok) {
// 	callback(await resp.json());
// 	} else {
// 	callback([]);
// 	}
// }

// module.exports.submitRemMod = async (userId, callback) => {
// 	const data = new FormData();
// 	data.append('remmod', userId);
// 	const resp = await fetch(`${shardOrigin}/api/modtools`, {
// 	credentials: 'include',
// 	method: 'POST',
// 	body: data,
// 	});
// 	callback(resp.ok, await resp.text());
// }

// module.exports.banMe = () => makeAPIGETRequest('/banme');

// const shardHost = (() => {
// 	if (!window.ssv
// 	|| !window.ssv.shard
// 	|| window.location.host === 'fuckyouarkeros.fun'
// 	) {
// 	return '';
// 	}
// 	const hostParts = window.location.host.split('.');
// 	if (hostParts.length > 2) {
// 	hostParts.shift();
// 	}
// 	return `${window.ssv.shard}.${hostParts.join('.')}`;
// })();

// const shardOrigin = (shardHost && `${window.location.protocol}//${shardHost}`) + '/api';

// async function makeAPIGETRequest(
// 	url,
// 	credentials = true,
// 	addShard = true,
// ) {
// 	if (addShard) {
// 	url = `${shardOrigin}${url}`;
// 	}
// 	try {
// 	const response = await fetchWithTimeout(url, {
// 		credentials: (credentials) ? 'include' : 'omit',
// 	});

// 	return response.json();
// 	} catch (e) {
// 	return {
// 		errors: [`Could not connect to server, please try again later :(`],
// 	};
// 	}
// }

// async function fetchWithTimeout(url, options = {}) {
// 	const { timeout = 30000 } = options;

// 	const controller = new AbortController();
// 	const id = setTimeout(() => controller.abort(), timeout);

// 	const response = await fetch(url, {
// 		...options,
// 		signal: controller.signal,
// 	});
// 	clearTimeout(id);

// 	return response;
// }

const ids = new Set();
export const uniqueId = () => {
	let id = 0;

	do {
		id = parseInt(Math.random().toString().substring(2));
	} while(ids.has(id));
	ids.add(id);

	return id;
}

export const uniqueSelector = () => uniqueId().toString().split('')
	.map(ch => String.fromCharCode(65 + parseInt(ch) % 26)).join('');

export const confuseString = (text: string) => {
	// const empty = [String.fromCharCode(8232), '‎'];
	// e.innerText = options.text.split('').map(ch => {
	// 	return ch + empty[Math.floor(Math.random() * empty.length)];
	// }).join('');
	// return text.split('').join(String.fromCharCode(8232));
	return text.split('').join('‎');
}

export const sq = (x: number) => x * x;

export const sleep = (delay: number): Promise<void> => new Promise(r => setTimeout(r, delay));

export const since = (from: number) => Date.now() - from;

const numReg = new RegExp(/-?\d+/g);
export const matchNumbers = (str: string) => str.match(numReg)?.map(parseFloat);

export const shuffle = <T>(array: Array<T>) => {
	for (let i = array.length - 1; i !== -1; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = array[i];
		array[i] = array[j];
		array[j] = temp;
	}

	return array;
}

export const swap = <T>(arr: Array<T>, i: number, j: number) => {
	const buffer = arr[i];
	arr[i] = arr[j];
	arr[j] = buffer;
}

export const squareInt = (x: number) => sq(Math.floor(x));

export const sortAscending = <T>(slice: Array<T>, handle: (x: T) => number) => (
	slice.sort((a: T, b: T) => handle(a) > handle(b) ? 1 : -1));

export const sortDescending = <T>(slice: Array<T>, handle: (x: T) => number) => (
	slice.sort((a: T, b: T) => handle(a) < handle(b) ? 1 : -1));

export const hash = (str: string) => {
	let hash = 0;
	for(let i = 0; i !== str.length; i++) {
		hash = ((hash << 5) - hash) + str.charCodeAt(i);
		hash |= 0;
	}
	return hash;
}

export const defineCanvas = () => {
	if(/.*:\/\/.*(pixelplanet)|(fuckyouarkeros)\.fun.*/.test(location.origin)) {
		const canvas = location.hash.match(/#[a-z]/g);
		return canvas && canvas.length ? {
			'd': CANVASES.PPF_EARTH,
			'm': CANVASES.PPF_MOON,
			'c': CANVASES.PPF_CORONA,
			'y': CANVASES.PPF_PZ,
			'z': CANVASES.PPF_PC,
			'w': CANVASES.PPF_BIT,
			't': CANVASES.PPF_TOP,
		}[canvas[0][1]] : undefined;
	}
}

export const randDuration = (min: number, max: number) => {
	return min + Math.floor(Math.random() * (max - min));
}

export const last = <T>(a: Array<T>): T | undefined => a[a.length - 1];

export const makeDraggable = (
	mover: HTMLElement,
	body: HTMLElement,
	onchangePosition?: (x: number, y: number) => void
) => {
	let mouseX = 0;
	let mouseY = 0;
	let mouseXOnstart = 0;
	let mouseYOnstart = 0;

	const limitX = (x: number) => limit(0, x, unsafeWindow.innerWidth - body.offsetWidth);
	const limitY = (y: number) => limit(0, y, unsafeWindow.innerHeight - body.offsetHeight);

	body.style.top = limitY(body.offsetTop) + 'px';
	body.style.left = limitX(body.offsetLeft) + 'px';

	const elementDrag = (e: MouseEvent) => {
		e.preventDefault();

		mouseX = mouseXOnstart - e.clientX;
		mouseY = mouseYOnstart - e.clientY;
		mouseXOnstart = e.clientX;
		mouseYOnstart = e.clientY;

		body.style.top = limitY(body.offsetTop - mouseY) + 'px';
		body.style.left = limitX(body.offsetLeft - mouseX) + 'px';
	}

	const closeDragElement = () => {
		window.removeEventListener('mouseup', closeDragElement);
		window.removeEventListener('mousemove', elementDrag);
		const matchedLeft = matchNumbers(body.style.left);
		const matchedTop = matchNumbers(body.style.top);
		if(matchedLeft && matchedTop && onchangePosition) {
			onchangePosition(matchedLeft[0], matchedTop[0]);
		}
	}

	const dragMouseDown = (e: MouseEvent) => {
		e.preventDefault();

		mouseXOnstart = e.clientX;
		mouseYOnstart = e.clientY;

		window.addEventListener('mouseup', closeDragElement);
		window.addEventListener('mousemove', elementDrag);
	}

	mover.addEventListener('mousedown', dragMouseDown);
}

let keydownCatcher: Function | null = null;
document.addEventListener('keydown', e => {
	if(keydownCatcher) {
		e.stopPropagation();
		keydownCatcher(e);
	}
}, true);

export const interceptKeydown = (handler: (e: KeyboardEvent) => void) => keydownCatcher = handler;
export const stopKeydownInterception = keydownCatcher = null;

export const createHeatmap = (/*api: CanvasAPI,*/ targeter: ITargeter) => {
	// const fake = fakeFrom(api);
	const { width, height } = targeter;

	const ctx = <CanvasRenderingContext2D>document.createElement('canvas').getContext('2d');
	ctx.canvas.width = width;
	ctx.canvas.height = height;
	const id = ctx.getImageData(0, 0, width, height);
	const { data } = id;

	if(targeter instanceof SortingTargeter) {
		const { targets } = targeter;
		targets.forEach((t, i) => {
			const value = Math.floor(255 * ((targets.length - i) / targets.length));
			const j = t[1] * width + t[0] << 2;
			data[j | 0] = value;
			// data[j | 1] = 0;
			// data[j | 2] = 0;
			data[j | 3] = 255;
		});

		ctx.putImageData(id, 0, 0);
		return ctx;
	}
}

export const limit = (min: number, x: number, max: number) => Math.max(min, Math.min(x, max));