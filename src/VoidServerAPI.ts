import { Emitter } from './common'
import { sleep } from './functions'

const MAX_REQUESTS_PER_HOUR = 4000;

export enum EVENTS {
	PING,
	PING_ERROR
}

export default class extends Emitter<{
	[EVENTS.PING]: number,
	[EVENTS.PING_ERROR]: Error
}> {
	private online: number | null = null
	private url: string

	constructor(
		url = 'https://voidserv.glitch.me'
	) {
		super();

		this.url = url;

		(async () => {
			while (true) {
				await this.ping()
				.then(online => {
					this.online = online;
					this.emit(EVENTS.PING, this.online);
				})
				.catch(e => {
					this.online = null;
					this.emit(EVENTS.PING_ERROR, e);
				});

				await sleep(this.getPingDelay());
			}
		})();
	}

	public getOnline(): number | null {
		return this.online;
	}

	public getPingDelay(): number {
		return this.online === null ? 120e3 : 3600e3 / MAX_REQUESTS_PER_HOUR * this.online + 40e3;
	}

	private ping(): Promise<number> {
		return fetch(this.url + '/online', { method: 'POST' })
		.then(res => res.text())
		.then(data => +data);
	}
}