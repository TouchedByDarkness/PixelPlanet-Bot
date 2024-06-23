import { ITargeter } from './types'
import { Pixel, CanvasAPI } from '../CanvasAPI'

export default class implements ITargeter {
	private queue: Array<Pixel> = []
	private counter = 0

	get width() {
		return -1;
	}

	get height() {
		return -1;
	}

	constructor(
		private api: CanvasAPI
	) {}

	public nexts(amount: number) {
		if(amount < 0) {
			return [];
		}

		const targets: Array<Pixel> = [];
		for(; this.counter < this.queue.length && targets.length !== amount; this.counter++) {
			const pxl = this.queue[this.counter];
			if(!this.api.compare(pxl)) {
				targets.push(pxl);
			}
		}

		this.counter = Math.max(0, this.counter - targets.length);

		return targets;
	}

	public countTargets() {
		return this.queue.length;
	}

	public countErrors() {
		let errors = 0;
		let timeToEnd = 0;

		this.queue.forEach(pxl => {
			if(!this.api.compare(pxl)) {
				errors++;
				timeToEnd += this.api.predictCooldown(pxl.x, pxl.y);
			}
		});

		return { errors, timeToEnd }
	}
}