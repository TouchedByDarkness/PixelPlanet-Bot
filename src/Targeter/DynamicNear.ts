import { CanvasAPI } from '../CanvasAPI'
import Template from '../Template'
import SuperTargeter from './SuperTargeter'
import { ITargeter, Target } from './types'
import { createTargets } from './strategies'
import { shuffle, sq } from '../functions'

export default class extends SuperTargeter implements ITargeter {
	private targets: Array<Target>
	private history: Array<Target>

	constructor(api: CanvasAPI, tmp: Template) {
		super(api, tmp);
		this.targets = shuffle(createTargets(tmp));
		this.history = [];
	}

	public nexts(needed: number) {
		if(needed === 0) {
			return [];
		}

		const result: Array<Target> = [];

		let last = this.history.pop() ?? this.targets[0];
		// check history
		while(true) {
			const target = this.history.pop()
			if(target === undefined) {
				break;
			}

			if(this.checkTarget(target)) {
				if(result.push(target) === needed) {
					break;
				}
			}
		}

		// find nearest
		while(result.length !== needed) {
			let minDist = Infinity;
			let minIndex = -1;

			let i = this.targets.indexOf(last);
			for(let totalCounter = 0; totalCounter !== this.targets.length; totalCounter++, i++) {
				if(i === this.targets.length) {
					i = 0;
				}

				const t = this.targets[i];
				if(this.history.includes(t) || result.includes(t)) {
					continue;
				}

				if(this.checkTarget(t)) {
					const d = sq(last[0] - t[0]) + sq(last[1] - t[1]);
					if(d < minDist) {
						minDist = d;
						minIndex = i;
						if(d < 2) {
							break;
						}
					}
				}
			}

			last = this.targets[minIndex]
			result.push(last);
		}

		this.history = result;
		return result.map(t => this.targetToPixel(t));
	}

	public countErrors() {
		return this._countErrors();
	}

	public countTargets() {
		return this.targets.length;
	}
}