import Emitter from './StrictEmitter'
import { errDisconnected } from './errors'

export enum EVENTS {
	CONNECT,
	DISCONNECT,
	ERROR,
	STRING,
	BINARY
}

export type EventMap = {
	[EVENTS.CONNECT]: void,
	[EVENTS.DISCONNECT]: CloseEvent,
	[EVENTS.ERROR]: Event,
	[EVENTS.STRING]: string,
	[EVENTS.BINARY]: ArrayBuffer
}

export type Options = {
	reconnectDelay?: number
}

export default class extends Emitter<EventMap> {
	private url: string
	private ws: WebSocket | null = null

	constructor (url: string, options?: Options) {
		super();

		this.url = url;
		if (options) {
			if (options.reconnectDelay) {
				this.on(EVENTS.DISCONNECT, e => {
					if(!e.wasClean) {
						setTimeout(() => this.connect(), options.reconnectDelay);
					}
				});
			}
		}
	}

	public get connected() {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
	}

	public get disconnected() {
		return !this.connected;
	}

	public get connecting() {
		return this.ws && this.ws.readyState === WebSocket.CONNECTING;
	}

	public connect (): Promise<void> {
		return new Promise((resolve, reject) => {
			if(this.ws && [WebSocket.CONNECTING, WebSocket.OPEN].includes(this.ws.readyState)) {
				reject(new Error('try connect when websocket is OPEN or CONNECTING'));
			}

			let resolved = false;
			this.ws = new WebSocket(this.url);
			this.ws.binaryType = 'arraybuffer';
			this.ws.onopen = () => {
				this.emit(EVENTS.CONNECT);
				resolved = true;
				resolve();
			}
			this.ws.onclose = e => {
				this.emit(EVENTS.DISCONNECT, e);
				if(!resolved) {
					reject(e);
				}
			}
			this.ws.onerror = (e: Event) => {
				this.emit(EVENTS.ERROR, e);
			}
			this.ws.onmessage = ({ data }) => {
				if (typeof data === 'string') {
					this.emit(EVENTS.STRING, data);
				} else {
					this.emit(EVENTS.BINARY, <ArrayBuffer>data);
				}
			}
		});
	}

	public async disconnect() {
		if(!this.ws) {
			return;	
		}

		this.ws.close();
		await this.wait(EVENTS.DISCONNECT);

		this.ws = null;
	}

	public send (data: string | ArrayBuffer) {
		if (this.ws === null || this.disconnected) {
			throw errDisconnected;
		}

		this.ws.send(data);
	}
}