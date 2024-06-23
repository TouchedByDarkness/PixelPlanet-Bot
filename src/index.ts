import {
	defineCanvas,
	last,
	notify,
	$,
	createHeatmap,
	downloadCanvas
} from './functions'
import Template from './Template'
import {
	create as createAPI,
	EVENTS as  CANVAS_EVENTS,
	CANVASES,
	CanvasAPI,
	// Workspace
} from './CanvasAPI'
import Storage from './Storage'
import VoidAPI, { EVENTS as VOID_EVENTS } from './VoidServerAPI'
import GUI from './GUI'
import Bot, { EVENTS as BOT_EVENTS, STATUSES } from './Bot'
import global from './global'
import {
	sortings,
	createSortingTargeter,
	// ITargeter
} from './Targeter'
import bus, { EVENTS as APP_EVENTS } from './eventBus'
import {
	Stringer,
	errUndefinedStrategy,
	errNoTemplateSrc,
	errNoTempatePosition,
	errUndefinedCanvas,
	errWrongDefaultStrategy,
	AsyncSingleton,
	GoError
} from './common'
import {
	STRATEGY as DEFAULT_STRATEGY,
	STOP_ON_CAPTCHA as DEFAULT_STOP_ON_CAPTCHA,
} from './defaults'

import './protection'
import './canvasHooks'

if(!sortings[DEFAULT_STRATEGY]) {
	throw errWrongDefaultStrategy;
}

global.storage = new Storage({ localStorageKey: 'darkness_bot' });

if(!global.storage.has('strategy')) {
	global.storage.set('strategy', DEFAULT_STRATEGY);
}

if(!global.storage.has('stopOnCaptcha')) {
	global.storage.set('stopOnCaptcha', DEFAULT_STOP_ON_CAPTCHA);
}

const gui = new GUI();
gui.setBotStatus('idle');

const bot = new AsyncSingleton(async () => {
	const _api = await api.get();
	if(!_api) {
		return null;
	}

	await tryChangeWorkspace();
	// await _api.addWorkspace(_api.createWorkspace(..._template.toArray()));
	// log('workspace is ready');

	const _targeter = await targeter.get();
	if(!_targeter) {
		return null;
	}

	const bot = new Bot(_api, _targeter, null)
		.on(BOT_EVENTS.BOT_PROGRESS_INFO, info => bus.emit(APP_EVENTS.BOT_PROGRESS_INFO, info))
		.on(BOT_EVENTS.CAPTCHA, () => bus.emit(APP_EVENTS.CAPTCHA));
	log('bot instance is ready');
	return bot;
}, e => {
	log('cant create bot');
	log(e);
	gui.setBotStatus('error');
});

const targeter = new AsyncSingleton(async () => {
	const [_template, _api] = await Promise.all([template.get(), api.get()]);
	if(!_template || !_api) {
		return null;
	}

	handleQuantization(_template, _api);

	const strategy = (
		global.storage.has('strategy') && <string>global.storage.get('strategy') in sortings ?
		<string>global.storage.get('strategy') :
		DEFAULT_STRATEGY);

	const start = performance.now();
	const targeter = createSortingTargeter(_api, _template, strategy) || null;
	if(!targeter) {
		throw errUndefinedStrategy;
	}

	log('targeter is ready in', ((performance.now() - start) / 1e3).toFixed(3), 's.');
	return targeter;
}, e => {
	log('cant create targeter');
	log(e);
	gui.setBotStatus(e);
});

const template = new AsyncSingleton(async () => {
	const x = global.storage.get('template.x');
	const y = global.storage.get('template.y');
	if(x === null || y === null) {
		throw errNoTempatePosition;
	}

	const src = global.storage.get('template.src');
	if(!src) {
		throw errNoTemplateSrc;
	}

	return new Template({
		name: src.startsWith('data:image') ? 'cached' : src.split('/')[0] || 'unknown',
		x, y
	})
	.load(src)
	.then(template => {
		log('template is ready');
		return template;
	});
}, e => {
	log('cant load template');
	log(e);
	gui.setBotStatus(e);
});

const api = new AsyncSingleton(async () => {
	const canvas = defineCanvas();
	if(canvas === undefined || !(canvas in CANVASES)) {
		throw errUndefinedCanvas;
	}

	const api = await createAPI(canvas);
	log('api is ready');
	api.on(CANVAS_EVENTS.PLACE_PIXELS, pixels => bus.emit(APP_EVENTS.PLACE_PIXELS, pixels));
	api.on(CANVAS_EVENTS.PIXELS, pixels => bus.emit(APP_EVENTS.PIXELS, pixels));
	return api;
}, e => {
	log('cant create api');
	log(e);
	gui.setBotStatus(e);
	return Promise.resolve(null);
});

global.bot = bot;
global.targeter = targeter;
global.api = api;
global.template = template;

// @ts-ignore
unsafeWindow.db = global;

(async () => {
	await (() => {
		const p: Array<Promise<any>> = [api.get()];
		if(
			global.storage.has('template.x') &&
			global.storage.has('template.y') &&
			global.storage.has('template.src')) {
			p.push(template.get());
		}
		return Promise.all(p);
	})();

	setInterval(async () => {
		const _api = await api.get();
		gui.setCooldown(_api ? _api.getCooldown() / 1e3 : null);
	}, 110);

	const voidApi = new VoidAPI('https://voidserv.glitch.me');
	voidApi.on(VOID_EVENTS.PING, online => gui.setBotOnline(online));
	voidApi.on(VOID_EVENTS.PING_ERROR, e => {
		console.error(e);
		gui.setBotOnline(null);
	});

	const mouse = {
		worldX: 0,
		worldY: 0
	}

	// window.addEventListener('focus', () => bus.emit(APP_EVENTS.FOCUS));
	// window.addEventListener('blur', () => bus.emit(APP_EVENTS.BLUR));
	bus.on(APP_EVENTS.CHANGE_TEMPLATE_X, async x => {
		global.storage.set('template.x', x);
		if(template.ready) {
			await bot.now()?.stop();
			template.now()?.moveX(x);
		}
	});
	bus.on(APP_EVENTS.CHANGE_TEMPLATE_Y, async y => {
		global.storage.set('template.y', y);
		await bot.now()?.stop();
		template.now()?.moveY(y);
	});
	bus.on(APP_EVENTS.CHANGE_TEMPLATE_SRC, async src => {
		global.storage.set('template.src', src);
		await template.clear();
		tryChangeTargeter();
	});
	bus.on(APP_EVENTS.CHANGE_MOUSE_POSITION, ([x, y]) => {
		mouse.worldX = x;
		mouse.worldY = y;
	});
	bus.on(APP_EVENTS.SWITCH_BOT, switchBot);

	bus.on(APP_EVENTS.CHANGE_STRATEGY, strategy => {
		global.storage.set('strategy', strategy);
		log(`change strategy to "${strategy}"`)
		tryChangeTargeter();
	});
	Object.keys(sortings).forEach(strategy => gui.addStrategy(strategy));
	gui.changeStrategy(global.storage.get('strategy') ?? DEFAULT_STRATEGY);

	bus.on(APP_EVENTS.BOTTING_ERROR, error => {
		gui.setBotStatus('error');
		bot.now()?.stop();

		log(error);
	});

	bus.on(APP_EVENTS.BOT_PROGRESS_INFO, async info => {
		const [errors, time] = info ? [info.errors, info.timeToEnd] : [null, null];
		const targets = targeter.now()?.countTargets() ?? undefined;

		if(time) {
			if(time instanceof Array) {
				gui.setBuildPredict(time[0] / 1e3, time[1] / 1e3);
			} else {
				gui.setBuildPredict(time / 1e3);
			}
		}

		gui.setProgress(errors, targets);
	});

	bus.on(APP_EVENTS.PLACE_PIXELS, pixels => {
		const pxl = last(pixels);
		// console.log('place', ...pixels);
		if(pxl) {
			const _api = api.now();
			gui.setLastPlaced(
				pxl.x, pxl.y,
				_api?.palette.idToRGB(pxl.id) ?? pxl.id);
		}
	});

	// bus.on(APP_EVENTS.PIXELS, pixels => {
		// console.log('arrived', ...pixels);
	// });

	bus.on(APP_EVENTS.CAPTCHA, () => {
		if(global.storage.get('stopOnCaptcha') ?? DEFAULT_STOP_ON_CAPTCHA) {
			bot.now()?.stop();
		}

		notify('you need solve CAPTCHA');
	});

	bus.on(APP_EVENTS.SHOW_HEATMAP, async () => {
		const _targeter = await targeter.get();
		if(!_targeter) {
			return;
		}

		const ctx = createHeatmap(_targeter);
		if(ctx) {
			const _template = await template.get();
			const filename = (
				_template?.name ?
				_template.name + '_' + (global.storage.get('strategy') || 'nostrat') :
				undefined);
			downloadCanvas(ctx.canvas, filename);
		} else {
			log('heatmap canvas is undefined');
		}
	});

	window.addEventListener('keydown', ({ code: key }) => {
		// TODO
		if($('.show form') || $('#wm .show')) {
			return;
		}

		switch(key) {
			case 'KeyB':
				switchBot();
				break;
			case 'KeyN':
				bus.emit(APP_EVENTS.CHANGE_TEMPLATE_X, mouse.worldX);
				bus.emit(APP_EVENTS.CHANGE_TEMPLATE_Y, mouse.worldY);
				gui.setTemplatePosition(mouse.worldX, mouse.worldY);
				break;
			// default:
			// 	console.log(key);
		}
	});
})();

async function switchBot() {
	const _bot = await bot.get();
	if(!_bot) {
		return;
	}

	switch(_bot.status) {
		case STATUSES.WORKS:
			_bot.stop();
			break
		case STATUSES.IDLE:
			wrapBotStart(_bot.start());
			break;
	}
}

function log(...messages: Array<string | Stringer>) {
	// TODO
	console.debug('[DB]' , ...messages.map(e => typeof e === 'object' && e.hasOwnProperty('toString') ? e.toString() : e));
}

function handleQuantization(template: Template, api: CanvasAPI) {
	if(template.readyState !== Template.QUANTIZED) {
		const start = performance.now();
		template.quantize(api.palette);
		log('template quantized in', ((performance.now() - start) / 1e3).toFixed(3), 's.');
	}

	return template;
}

async function tryChangeTargeter() {
	await targeter.clear();

	if(bot.ready) {
		const _targeter = await targeter.get();
		const _bot = bot.now();
		if(!_bot || !_targeter) {
			const missing = [];
			if(!_bot) {
				missing.push('bot');
			}

			if(!_targeter) {
				missing.push('targeter');
			}

			log('cant change targeter because ' + missing.join(' and ') + ' is missing');
			return;
		}

		await tryChangeWorkspace();
		_bot.changeTargeter(_targeter);
	} else {
		await tryChangeWorkspace();
	}
}

async function tryChangeWorkspace() {
	const [_api, _template] = await Promise.all([api.get(), template.get()]);
	if(!_api || !_template) {
		const missing = [];
		if(!_api) {
			missing.push('api');
		}

		if(!_template) {
			missing.push('template');
		}

		log('cant change workspace because ' + missing.join(' and ') + ' is missing');
		return;
	}

	let botShouldStart = false;
	let _bot = bot.now();
	if(_bot && _bot.status !== STATUSES.IDLE) {
		botShouldStart = true;
		await _bot.stop();
	}

	const workspace = _api.createWorkspace(..._template.toArray());
	if(!_api.hasWorkspace(workspace)) {
		await _api.changeWorkspace(workspace);
	}

	if(botShouldStart) {
		_bot = bot.now();
		if(_bot) {
			wrapBotStart(_bot.start());
		}
	}
}

function wrapBotStart(p: Promise<GoError>) {
	gui.setBotStatus('works');
	return p.then(e => {
		if(e) {
			log('error returned', e);
			bus.emit(APP_EVENTS.BOTTING_ERROR, e);
		} else {
			gui.setBotStatus('idle');
		}
	});
}