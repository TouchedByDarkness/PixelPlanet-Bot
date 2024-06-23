import Palette from '../Palette'
import {
	Workspace,
	ILowLevelAPI,
	Pixel,
	CaptchaSolution
} from './types'
import {
	GoDuration,
	GoError,
	Vec2,
	EventKey,
	EventHandler,
	Aborter
} from '../common'
import { includesChunks as includes } from './functions'
import { downloadCanvas, sq, sleep } from '../functions'

export enum EVENTS {
	CONNECT,
	DISCONNECT,
	READY,
	PIXELS,
	PLACE_PIXELS,
	CHUNK,
	CAPTCHA_RESULT
}

export type EventMap = {
	[EVENTS.CONNECT]: void,
	[EVENTS.DISCONNECT]: void,
	[EVENTS.READY]: void,
	[EVENTS.PIXELS]: Array<Pixel>
	[EVENTS.PLACE_PIXELS]: Array<Pixel>
	[EVENTS.CHUNK]: Vec2,
	[EVENTS.CAPTCHA_RESULT]: number
}

export default class {
	public palette: Palette

	public get info() {
		return this.low.info;
	}

	private workspaces: Array<Workspace> = []
	private chunks: Array<Vec2> = []

	constructor(
		private low: ILowLevelAPI
	) {
		const { offset, colors } = this.info.palette;
		this.palette = new Palette(offset, colors);
	}

	public on<K extends EventKey<EventMap>>(event: K, handler: EventHandler<EventMap[K]>) {
		return this.low.emitter.on(event, handler);
	}

	public emit<K extends EventKey<EventMap>>(event: K, params?: EventMap[K]) {
		return this.low.emitter.emit(event, params);
	}

	public wait<K extends EventKey<EventMap>>(event: K): Promise<EventMap[K]> {
		return this.low.emitter.wait(event);
	}

	public getCaptcha() {
		return this.low.getCaptcha();
	}

	public sendAnswer(solution: CaptchaSolution) {
		return this.low.sendAnswer(solution);
	}

	public getCooldown() {
		return this.low.timer.get();
	}

	public pixelsCanPlace() {
		const cd: GoDuration = Math.max(this.info.minCd, this.info.maxCd);
		return Math.floor((this.info.stack - this.getCooldown()) / cd);
	}

	public get(x: number, y: number) {
		return this.low.get(x, y);
	}

	public compare(pxl: Pixel) {
		const clr = this.get(pxl.x, pxl.y);
		return this.palette.sameIds(clr, pxl.id);
	}

	public predictCooldown(x: number, y: number) {
		return this.low.predictCooldown(x, y);
	}

	public createWorkspace(x1: number, y1: number, x2: number, y2: number) {
		return {
			x1, y1, x2, y2,
			chunks: this.low.getChunksCoords(x1, y1, x2, y2)
		}
	}

	public hasWorkspace(toCheck: Workspace) {
		return this.workspaces.some(w => (
			w.x1 === toCheck.x1 &&
			w.y1 === toCheck.y1 &&
			w.x2 === toCheck.x2 &&
			w.y2 === toCheck.y2));
	}

	public async changeWorkspace(w: Workspace) {
		// const alive = this.chunks.filter(ch => includes(w.chunks, ch));
		// const toDrop = this.chunks.filter(ch => !includes(alive, ch));
		// if(toDrop.length)  {
		// 	this.low.dropChunks(toDrop);
		// }
		// this.workspaces = [w];

		// const unloaded = w.chunks.filter(ch => !includes(alive, ch));
		// return this.low.prepareChunks(unloaded);

		this.clearWorkspaces();
		await this.addWorkspace(w);
	}

	public async addWorkspace(w: Workspace) {
		const toAdd = w.chunks.filter(ch => !includes(this.chunks, ch))
		await this.low.prepareChunks(toAdd);
		this.chunks.push(...toAdd);
		this.workspaces.push(w);
	}

	public clearWorkspaces() {
		if(this.chunks.length) {
			this.low.dropChunks(this.chunks);
		}

		this.chunks = [];
	}

	public placePixels(pxls: Array<Pixel>) {
		return this.low.placePixels(pxls);
	}

	public async smartPlace (queue: Array<Pixel>, aborter?: Aborter): Promise<[Array<Pixel>, GoError]> {
		queue = queue.slice();

		const queueProcessing: Promise<[Array<Pixel>, GoError]> = new Promise(async resolve => {
			while (true) {
				if(aborter && aborter.triggered) {
					return;
				}

				let current = queue.shift();
				if(!current) {
					break;
				}

				const err = await this.low.placePixels([current]);
				if (err) {
					queue.unshift(current);
					resolve([queue, err]);
					return;
				}

				if (queue.length) {
					await this.waitBecausePixelsDistance(current, queue[0]);
				}
			}

			resolve([queue, null]);
		});

		if(aborter) {
			const result = await Promise.any([queueProcessing, aborter.promise]);

			if(result instanceof Error) {
				aborter.destroy();
				return [queue, result];
			} else {
				return result;
			}
		} else {
			return queueProcessing;
		}
	}

	public async download(x1: number, y1: number, x2: number, y2: number) {
		await this.low.prepareChunks(this.low.getChunksCoords(x1, y1, x2, y2));

		const width = x2 - x1;
		const height = y2 - y1;

		const ctx = <CanvasRenderingContext2D>document.createElement('canvas').getContext('2d');
		ctx.canvas.width = width;
		ctx.canvas.height = height;

		const id = ctx.getImageData(0, 0, width, height);
		const d = id.data;

		for (let y = y1, i = 0; y !== y2; y++) {
			for (let x = x1; x !== x2; x++, i+=4) {
				const clr = this.palette.idToRGB(this.get(x, y));
				if (clr === undefined) {
					console.log('wrong id', this.get(x, y), 'at', x, y);
					continue;
				}

				d[i | 0] = clr[0];
				d[i | 1] = clr[1];
				d[i | 2] = clr[2];
				d[i | 3] = 255;
			}
		}

		ctx.putImageData(id, 0, 0);
		downloadCanvas(ctx.canvas, `${this.info.name}_${x1}_${y1}_${x2}_${y2}`);
	}

	public destroy() {
		return this.low.destroy();
	}

	private waitBecausePixelsDistance (p1: Pixel, p2: Pixel) {
		const distance = Math.sqrt(sq(p1.x - p2.x) + sq(p1.y - p2.y));
		
		let waitTime;
		if (distance === 1) {
			waitTime = 50;
		} else if (distance < 1.5) {
			waitTime = 100;
		} else {
			waitTime = 125 * distance;
		}

		return sleep(Math.min(0.75 * this.info.minCd, waitTime));
	}
}