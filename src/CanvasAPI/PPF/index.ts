/// <reference path="./packets.d.ts"/>

import {
	WebSocket,
	WS_EVENTS,
	Emitter,
	Vec2,
	Vec3,
	GoError,
	Rect,
	errPromiseDeadline
} from '../../common'
import SuperAPI from '../SuperAPI'
import { sleep } from '../../functions'
import { Chunk, Chunks } from '../Chunks'
import { CanvasInfo, emptyCanvasInfo, ILowLevelAPI, LLABuilder, Pixel } from '../types'
import { ChunkPixel } from './types'
import { EventMap as ApiEventMap, EVENTS as API_EVENTS } from '../CanvasAPI'
import Timer from '../Timer'
import { group } from 'group-items'
import {
	hydratePixelUpdate,
	hydratePixelReturn,
	hydrateCoolDown,
	hydrateCaptchaReturn,
	dehydrateRegCanvas,
	dehydrateRegChunk,
	dehydrateDeRegMChunks,
	dehydratePixelUpdate,
	dehydratePing,
} from './packets';
import {
	PIXEL_UPDATE_OP,
	PIXEL_RETURN_OP,
	COOLDOWN_OP,
	CAPTCHA_RETURN_OP,
} from './op';
import RET_CODES from './retcodes.json'
import errors from '../errors'
import captchaErrors from '../captchaResultErrors'
import { list as CANVASES, names as NAMES } from '../canvases'

enum LOCAL_EVENTS {
	RET_CODE,
	CAPTCHA_RESULT
}

const shardHost = (() => {
	if(!unsafeWindow?.ssv?.shard || unsafeWindow.location.host === 'fuckyouarkeros.fun') {
		return '';
	}

	const hostParts = window.location.host.split('.');
	if(hostParts.length > 2) {
		hostParts.shift();
	}

	return `${unsafeWindow.ssv.shard}.${hostParts.join('.')}`;
})();

const shardOrigin = shardHost && `${unsafeWindow.location.protocol}//${shardHost}`;

export const ID_TO_CANVAS = {
	0: CANVASES.PPF_EARTH,
	1: CANVASES.PPF_MOON,
	3: CANVASES.PPF_CORONA,
	5: CANVASES.PPF_PZ,
	6: CANVASES.PPF_PC,
	7: CANVASES.PPF_BIT,
	8: CANVASES.PPF_TOP
}

type AvailableIds = keyof typeof ID_TO_CANVAS

export const CANVAS_TO_ID = {
	[CANVASES.PPF_EARTH]: 0,
	[CANVASES.PPF_MOON]: 1,
	[CANVASES.PPF_CORONA]: 3,
	[CANVASES.PPF_PZ]: 5,
	[CANVASES.PPF_PC]: 6,
	[CANVASES.PPF_BIT]: 7,
	[CANVASES.PPF_TOP]: 8
}

type ChunkLoader = {
	chunk: number,
	aborter: AbortController
}

export type Captcha = {
	id: string
	svg: string
}

export type CaptchaSolution = {
	id: string
	solution: string
}

type LocalEventMap = {
	[LOCAL_EVENTS.CAPTCHA_RESULT]: number,
	[LOCAL_EVENTS.RET_CODE]: number
}


const compressChunkPosition = (pos: Vec2) => pos[0] << 8 | pos[1];
const decompressChunkPosition = (id: number): Vec2 => [id >> 8, id & 255];

class API extends SuperAPI implements ILowLevelAPI {
	private ws: WebSocket
	private _info: CanvasInfo = emptyCanvasInfo
	private loadQueue: Array<number> = []
	private chunks = new Chunks()
	private threads = 5
	private loaders: Array<ChunkLoader> = []
	private chunksProcessing = false
	public emitter = new Emitter<ApiEventMap>()
	private local = new Emitter<LocalEventMap>()
	public timer = new Timer()

	get info() {
		if(this._info === emptyCanvasInfo) {
			throw errors.errAPIIsntReady;
		}

		return this._info;
	}

	constructor(
		private canvasId: AvailableIds
	) {
		super();

		this.ws = new WebSocket(`${
			window.location.protocol === 'https:' ? 'wss:' : 'ws:'
		}//${
			shardHost || window.location.host
		}/ws`);

		this.ws.on(WS_EVENTS.CONNECT, async () => {
			this.emitter.emit(API_EVENTS.CONNECT);
			this.selectCanvas(this.canvasId);
			this.emitter.emit(API_EVENTS.READY);
			while(this.ws.connected) {
				await sleep(19e3);
				this.ws.send(dehydratePing());
			}
		});

		this.ws.on(WS_EVENTS.BINARY, data => {
			const view = new DataView(data);
			switch(view.getUint8(0)) {
				case PIXEL_UPDATE_OP:
					const packet = hydratePixelUpdate(view);
					const chunk = this.chunks.get(packet.i, packet.j);
					if (chunk) {
						packet.pixels.forEach(pxl => chunk.set(pxl[0], pxl[1]));
					}

					const pixels = packet.pixels.map(pxl => {
						const [x, y] = this.toWorld(packet.i, packet.j, pxl[0]);
						return <Pixel>{ x, y, id: pxl[1] }
					});

					this.emitter.emit(API_EVENTS.PIXELS, pixels);
					break;
				case PIXEL_RETURN_OP:
					const { retCode, wait } = hydratePixelReturn(view);
					this.timer.update(wait);
					this.local.emit(LOCAL_EVENTS.RET_CODE, retCode);
					break;
				case CAPTCHA_RETURN_OP:
					this.local.emit(LOCAL_EVENTS.CAPTCHA_RESULT, hydrateCaptchaReturn(view));
					break
				case COOLDOWN_OP:
					this.timer.update(hydrateCoolDown(view));
					break;
			}
		});

		this.ws.on(WS_EVENTS.DISCONNECT, () => this.emitter.emit(API_EVENTS.DISCONNECT));
	}

	static async build(canvasId: AvailableIds): Promise<ILowLevelAPI> {
		const api = new API(canvasId);
		await api.fetchMe();
		await api.ws.connect();
		return api;
	}

	public get(x: number, y: number) {
		const c = this.toTiled(x, y);
		// @ts-ignore
		return this.chunks.get(c[0], c[1]).get(c[2]);
	}

	public dropChunks(coords: Array<Vec2>) {
		const toDeReg: Array<Vec2> = [];

		for(const pos of coords) {
			const id = compressChunkPosition(pos);

			if (this.chunks.has(pos[0], pos[1])) {
				toDeReg.push(pos);
				this.chunks.delete(pos[0], pos[1]);
				continue;
			}

			if (this.loadQueue.includes(id)) {
				this.loadQueue = this.loadQueue.filter(toLoad => toLoad !== id);
				continue;
			}

			const loadersToDrop = this.loaders.filter(l => l.chunk === id);
			if (loadersToDrop.length) {
				loadersToDrop.forEach(l => l.aborter.abort());
				this.loaders = this.loaders.filter(l => l.chunk !== id);
			}
		}

		if (toDeReg.length) {
			this.deRegisterChunks(toDeReg);
		}
	}

	public async prepareChunks(chs: Array<Vec2>) {
		if (this.ws.disconnected) {
			await this.emitter.wait(API_EVENTS.READY);
		}

		chs.forEach(pos => this.loadQueue.push(compressChunkPosition(pos)));
		this.processMarked();
		await this.waitChunks(chs);
	}

	public async placePixels(pixels: Array<Pixel>): Promise<GoError> {
		const byChunks = this.groupPixels(pixels);
		let err: GoError = null;
		for (const ch in byChunks) {
			const group = byChunks[ch];

			const pos = decompressChunkPosition(+ch);

			this.emitter.emit(API_EVENTS.PLACE_PIXELS, group.map(({ offset, id }) => {
				const [x, y] = this.toWorld(pos[0], pos[1], offset);
				return { x, y, id }
			}));

			this.ws.send(dehydratePixelUpdate(pos[0], pos[1], group.map(p => [p.offset, p.id])));

			err = await this.local.wait(LOCAL_EVENTS.RET_CODE, 500)
			.then(code => {
				switch(code) {
					case RET_CODES.OK:
						const ch = this.chunks.get(pos[0], pos[1]);
						if(ch) {
							group.forEach(p => ch.set(p.offset, p.id));
						}
						return null;
					case RET_CODES.INVALID_CANVAS,
						RET_CODES.INVALID_X,
						RET_CODES.INVALID_Y,
						RET_CODES.INVALID_Z,
						RET_CODES.INVALID_COLOR:
						return errors.errCanvasAPIInteraction;
					case RET_CODES.NO_AUTH:
						return errors.errMustAuth;
					case RET_CODES.LOW_SCORE:
						return errors.errTooLowScore;
					case RET_CODES.PROTECTION:
						return errors.errPixelProtected;
					case RET_CODES.STACK_IS_FULL:
						return errors.errFullStack;
					case RET_CODES.CAPTCHA:
						return errors.errCaptcha;
					case RET_CODES.PROXY:
						return errors.errYouAreProxy;
					case RET_CODES.TOP10:
						return errors.errTooLowScore;
					case RET_CODES.PARALLEL_WS:
						return errors.errParallelPlace;
					default:
						return new Error(`unknown retcode: ${code}`);;
				}
			})
			.catch((e: Error) => {
				return e === errPromiseDeadline ? errors.errNoPlacePixelResult : e;
			});

			if(err) {
				return err;
			}
		}

		return err;
	}

	public async getCaptcha() {
		const res = await fetch(shardOrigin + '/captcha.svg', {
    		cache: 'no-cache'
		});
		
		if(!res.ok || res.status !== 200) {
			throw errors.errCanvasAPIInteraction;
		}

		const captchaSrc = URL.createObjectURL(await res.blob());
		const id = res.headers.get('captcha-id');
		if(id === null) {
			throw errors.errCanvasAPIInteraction;
		}

		const captcha = {
			id,
			svg: await fetch(captchaSrc).then(res => res.text())
		}

		return captcha;
	}

	public async sendAnswer({ solution, id }: CaptchaSolution) {
		this.ws.send(`cs,${JSON.stringify([solution, id])}`,);

		const result = await this.local.wait(LOCAL_EVENTS.CAPTCHA_RESULT);
		const interpretations = [
			true,
			captchaErrors.errCaptchaTimeout,
			false,
			captchaErrors.errInvalidSolution,
			errors.errCanvasAPIInteraction
		];
		
		return interpretations.length > result ? interpretations[result] : errors.errUnknownError;
	}

	public predictCooldown(x: number, y: number) { 
		const tiled = this.toTiled(x, y);
		// @ts-ignore
		if(this.chunks.get(tiled[0], tiled[1]).get(tiled[2]) < this.info.palette.offset) {
			return this.info.minCd;
		} else {
			return this.info.maxCd;
		}
	}

	public destroy() {
		this.dropChunks(this.loadQueue.map(decompressChunkPosition));
		return this.ws.disconnect();
	}

	private groupPixels(pixels: Array<Pixel>) {
		const groupped = group(pixels).by(pixel => {
			return compressChunkPosition(<Vec2>this.toTiled(pixel.x, pixel.y).slice(0, 2));
		}).asArrays();

		const chunks: Record<number, Array<ChunkPixel>> = {};

		groupped.forEach(group => {
			const tiled = this.toTiled(group[0].x, group[0].y);
			const chIndex = compressChunkPosition(<Vec2>tiled.slice(0, 2))
			chunks[chIndex] = group.map(pixel => ({
				offset: this.toTiled(pixel.x, pixel.y)[2],
				id: pixel.id
			}));
		});

		return chunks;
	}

	private async waitChunks(chs: Array<Vec2>) {
		chs = chs.slice().filter(ch => !this.chunks.has(ch[0], ch[1]));

		while(chs.length) {
			const loaded = await this.emitter.wait(API_EVENTS.CHUNK);
			const loadedId = compressChunkPosition(loaded);
			const index = chs.findIndex(ch => compressChunkPosition(ch) === loadedId);
			if (index !== -1) {
				chs.splice(index, 1);
			}
		}

		return;
	}

	private processMarked() {
		if (this.chunksProcessing) {
			return;
		} else {
			this.chunksProcessing = true;
		}

		while(this.loaders.length < this.threads) {
			const id = this.loadQueue.pop();
			if(id === undefined) {
				break;
			}

			const pos = decompressChunkPosition(id);
			if (this.chunks.has(pos[0], pos[1]) || this.loaders.some(l => l.chunk === id)) {
				continue;
			}

			const loader = {
				chunk: id,
				aborter: new AbortController()
			}

			this.loaders.push(loader);

			this.fetchChunk(pos, loader.aborter).then(chunk => {
				this.chunks.set(chunk, pos[0], pos[1]);
				this.registerChunk(pos);
				this.loaders.splice(this.loaders.indexOf(loader), 1);
				this.processMarked();
			});
		}

		this.chunksProcessing = false;
	}

	private fetchChunk(pos: Vec2, aborter?: AbortController) {
		const options = aborter ? {
			signal: aborter.signal
		} : {}

		return fetch(`${shardOrigin}/chunks/${this.canvasId}/${pos[0]}/${pos[1]}.bmp`, options)
		.then(res => {
			if(!res.ok) {
				console.debug(res);
				throw errors.errResponseIsntOk;
			}

			if(res.status !== 200) {
				console.debug(res);
				throw errors.errResponseStatusIsnt200;
			}

			return res.arrayBuffer();
		})
		.then(data => {
			const raw = new Uint8Array(data);
			const data_u32 = new Uint32Array(this.chunkSize);

			if (raw.length === this.chunkSize) {
				for (let i = 0; i !== raw.length; i++) {
					const pixel = raw[i];
					if (pixel >= 128) {
						// TODO bit opti
						data_u32[i] = pixel - 128;
					} else {
						data_u32[i] = pixel;
					}
				}

			}

			this.emitter.emit(API_EVENTS.CHUNK, pos);
			return new Chunk(data_u32);
		});
	}

	private registerChunk(ch: Vec2) {
		this.ws.send(dehydrateRegChunk(compressChunkPosition(ch)));
	}

	// private deRegisterChunk(ch: Vec2) {
	// 	this.ws.send(dehydrateDeRegChunk(compressChunkPosition(ch)));
	// }

	private deRegisterChunks(chs: Array<Vec2>) {
		this.ws.send(dehydrateDeRegMChunks(chs.map(ch => compressChunkPosition(ch))));
	}

	protected toTiled (x: number, y: number): Vec3 {
		const absX = x + (this.info.worldWidth >> 1);
		const absY = y + (this.info.worldHeight >> 1);
		return [
			absX >> 8,
			absY >> 8,
			(absY & 255) << 8 | (absX & 255)];
	}

	protected toWorld(xch: number, ych: number, offset: number): Vec2 {
		return [
			(xch << 8) - (this.info.worldWidth >> 1) + (offset & 255),
			(ych << 8) - (this.info.worldHeight >> 1) + (offset >> 8)];
	}

	private selectCanvas(id: number) {
		this.ws.send(dehydrateRegCanvas(id));
	}

	private async fetchMe() {
		const me = await fetch(`${shardOrigin}/api/me`)
			.then(res => res.json());
		const canvas = me.canvases[this.canvasId];
		const { size } = canvas;
		const id = ID_TO_CANVAS[this.canvasId];
		this._info = {
			id,
			name: NAMES[id],
			palette: {
				offset: canvas.cli,
				colors: canvas.colors
			},
			chunkWidth: 256,
			chunkHeight: 256,
			worldWidth: size,
			worldHeight: size,
			haveStack: true,
			stack: canvas.cds,
			minCd: canvas.bcd,
			maxCd: canvas.pcd,
			borders: new Rect(
				-(size / 2), -(size / 2),
				size / 2, size / 2)
		}
	}
}

const builders: Record<number, LLABuilder> = {};
builders[CANVASES.PPF_EARTH] = () => API.build(0);
builders[CANVASES.PPF_MOON] = () => API.build(1);
builders[CANVASES.PPF_CORONA] = () => API.build(3);
builders[CANVASES.PPF_PZ] = () => API.build(5);
builders[CANVASES.PPF_PC] = () => API.build(6);
builders[CANVASES.PPF_BIT] = () => API.build(7);
builders[CANVASES.PPF_TOP] = () => API.build(8);
export default builders;