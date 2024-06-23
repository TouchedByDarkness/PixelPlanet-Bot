import { CanvasInfo, emptyCanvasInfo, ILowLevelAPI, LLABuilder, Pixel } from '../types'
import { RGB, Rect } from '../../common'
import { list as CANVASES, names as NAMES } from '../canvases'
import { EventMap as ApiEventMap, EVENTS as API_EVENTS } from '../CanvasAPI'
import SuperAPI from '../SuperAPI'
import {
	WebSocket,
	WS_EVENTS
} from '../../common'
import { ZoneInfo } from './types'
import {
	ONLINE,
	PIXELS,
	PIXEL_COUNT,
	CAPTCHA,
	CAPTCHA_STATUS,
	PENALTY
} from './op'
import {
	deserializePixels
} from './packets'

const serverPath = `${unsafeWindow.location.origin}/server`; // "na" in original code
const tilesPath = `${unsafeWindow.location.origin}/tiles`; // "Jv" in original code
const zonesPath = `${unsafeWindow.location.origin}/zones`; // "tm" in original code
const usersPath = `${unsafeWindow.location.origin}/users`; // "Mr" in original code
const overlaysPath = `${unsafeWindow.location.origin}/overlays`; // "em" in original code

class API extends SuperAPI implements ILowLevelAPI {
	private ws: WebSocket
	public emitter = new Emitter<ApiEventMap>()
	public info = emptyCanvasInfo
	private ingameCanvasName: string = ''

	constructor() {
		super();
		
		this.ws = new WebSocket('wss://pixelzone.io/server/' + this.ingameCanvasName);
		
		this.ws.on(WS_EVENTS.CONNECT, () => {
			this.emitter.emit(API_EVENTS.CONNECT);
			this.emitter.emit(API_EVENTS.READY);
		});

		this.ws.on(WS_EVENTS.BINARY, data => {
			const view = new DataView(data);
			const opcode = view.getUint8(0);

			switch(opcode) {
				case ONLINE:
					// pass
					break;
				case PIXELS:
					const pixels = deserializePixels(view);
					console.log(pixels);
					break;
				PIXEL_COUNT
				CAPTCHA
				CAPTCHA_STATUS
				PENALTY
			}
		});
	}

	static async build(): Promise<ILowLevelAPI> {
		const api = new API();
		api.fetchInfo();
		api.ws.connect();
		return api;
	}

	public predictCooldown() {
		return this.info.minCd;
	}

	private async fetchInfo() {
		// const [me, zone] = <[Me, ZoneInfo]>Promise.all([
		// 	fetch(`${usersPath}/profile/me`, { credentials: 'include' }).then(r => r.json()),
		// 	fetch(zonesPath + '/main', { credentials: 'include' }).then(r => r.json())]);
		const zone: ZoneInfo = await fetch(zonesPath + '/main', { credentials: 'include' }).then(r => r.json());
		this.ingameCanvasName = zone.name;

		const CHUNK_SIDE = 256;
		const WORLD_SIDE = CHUNK_SIDE * 32;
		this.info = {
			id: CANVASES.PZ,
			name: NAMES[CANVASES.PZ],
			palette: {
				offset: 0,
				colors: zone.colors.map(hex => <RGB>[
					parseInt(hex.substr(1, 2), 16),
					parseInt(hex.substr(3, 2), 16),
					parseInt(hex.substr(5, 2), 16)])
			},
			chunkWidth: CHUNK_SIDE,
			chunkHeight: CHUNK_SIDE,
			worldWidth: WORLD_SIDE,
			worldHeight: WORLD_SIDE,
			haveStack: true,
			stack: zone.pixelCapacity,
			minCd: zone.pixelCooldown,
			maxCd: zone.pixelCooldown,
			borders: new Rect(
				-(WORLD_SIDE / 2), -(WORLD_SIDE / 2),
				WORLD_SIDE / 2, WORLD_SIDE / 2)
		}
	}
}

export default <Record<string, LLABuilder>>{
	[CANVASES.PZ]: () => API.build()
}