import { Pixel } from '../CanvasAPI/types'
import { Target, ITargeter, SortingFunc } from './types'
import { CanvasAPI } from '../CanvasAPI'
import SuperTargeter from './SuperTargeter'
import CycledCounter from './CycledCounter'
import Template from '../Template'

export default class extends SuperTargeter implements ITargeter {
	public targets: Array<Target>
	private counter: CycledCounter

	constructor(api: CanvasAPI, tmp: Template, sort: SortingFunc) {
		super(api, tmp);
		this.targets = sort(this.template);
		this.counter = new CycledCounter(this.targets.length);
	}

	public nexts(needed: number): Array<Pixel> {
		const targetsAmount = this.targets.length;

		const pixels: Array<Pixel> = [];
		// check in reverse direction
		// for (let totalCounter = 0; totalCounter !== targetsAmount; totalCounter++) {
		// 	if (this.counter.get() === 0) {
		// 		break;
		// 	}

		// 	const t = this.targets[this.counter.get()];
		// 	const tmpClr = this.template.get(t[0], t[1]);
		// 	// var cnvClr = this.api.GetPixelHumanlike(
		// 	const cnvClr = this.api.get(
		// 		t[0] + this.template.x1,
		// 		t[1] + this.template.y1);

		// 	if (pal.sameIds(tmpClr, cnvClr)) {
		// 		break;
		// 	} else {
		// 		this.counter.deinc();
		// 	}

		// 	pixels.push({
		// 		x: t[0] + this.template.x1,
		// 		y: t[1] + this.template.y1,
		// 		id: tmpClr });

		// 	if (pixels.length === needed) {
		// 		return pixels;
		// 	}
		// }

		// this.counter.inc(1 + pixels.length);

		// check current
		const pixel = this.handleTarget(this.targets[this.counter.get()]);
		if(pixel && pixels.push(pixel) === needed) {
			return pixels;
		}

		// check in reverse direction
		for(let totalCounter = 0; totalCounter !== targetsAmount; totalCounter++) {
			if(this.counter.get() === 0) {
				break;
			}

			const pixel = this.handleTarget(this.targets[this.counter.deinc()]);
			if(pixel) {
				if(pixels.push(pixel) === needed) {
					return pixels;
				}
			} else {
				break;
			}
		}

		// check in straight direction
		for(let totalCounter = 0; totalCounter !== targetsAmount; totalCounter++) {			
			const pixel = this.handleTarget(this.targets[this.counter.inc()]);
			if(pixel && pixels.push(pixel) === needed) {
				return pixels;
			}
		}

		return pixels;
	}

	public countErrors() {
		if(this.targets) {
			return this.countErrorsUsingTargets();
		} else {
			return this._countErrors();
		}
	}

	public countTargets() {
		return this.targets.length;
	}

	private countErrorsUsingTargets() {
		const pal = this.api.palette;
		let errors = 0;
		let timeToEnd = 0;
		for (let i = 0; i !== this.targets.length; i++) {
			const target = this.targets[i];

			const x = target[0] + this.template.x1;
			const y = target[1] + this.template.y1;

			const haveError = !pal.sameIds(
				this.template.get(target[0], target[1]),
				this.api.get(x, y));

			if (haveError) {
				errors++;
				timeToEnd += this.api.predictCooldown(x, y);
			}
		}

		return { errors, timeToEnd };
	}
}