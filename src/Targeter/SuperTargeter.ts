import { CanvasAPI, Pixel } from '../CanvasAPI'
import Template from '../Template'
import { Vec2 } from '../common/types'
import { Target } from'./types'

export default class {
	get width() {
		return this.template.width;
	}

	get height() {
		return this.template.height;
	}
	
	constructor(
		// TODO template and api should be protected
		public api: CanvasAPI,
		public template: Template
	) {
		if(this.template.readyState === Template.LOADED) {
			this.template.quantize(this.api.palette);
		}
	}

	protected _countErrors() {
		const pal = this.api.palette;

		let errors = 0;
		let timeToEnd = 0;
		const w = this.template.width;
		const h = this.template.height;
		for (let y = 0; y != h; y++) {
			for (let x = 0; x != w; x++) {
				const tmpClr = this.template.get(x, y);
				if (tmpClr === 255) {
					continue;
				}

				const worldX = x + this.template.x1;
				const worldY = y + this.template.y1;

				const cnvClr = this.api.get(worldX, worldY);
				if (!pal.sameIds(tmpClr, cnvClr)) {
					errors++;
					timeToEnd += this.api.predictCooldown(worldX, worldY);
				}
			}
		}

		return { errors, timeToEnd }
	}

	protected checkTarget(t: Vec2) {
		// const cnvClr = this.api.GetPixelHumanlike(
		return !this.api.palette.sameIds(
			this.template.get(t[0], t[1]),
			 this.api.get(
				t[0] + this.template.x1,
				t[1] + this.template.y1));
	}

	protected handleTarget(t: Vec2) {
		const id = this.template.get(t[0], t[1]);
		// TODO
		// const cnvClr = this.api.GetPixelHumanlike(
		const cnv = this.api.get(
			t[0] + this.template.x1,
			t[1] + this.template.y1);

		if(this.api.palette.sameIds(id, cnv)) {
			return undefined;
		}

		return {
			x: t[0] + this.template.x1,
			y: t[1] + this.template.y1,
			id
		}
	}

	protected targetToPixel(t: Target) {
		return <Pixel>{
			x: t[0] + this.template.x1,
			y: t[1] + this.template.y1,
			id: this.template.get(t[0], t[1])
		}
	}

	protected pixelToTarget(p: Pixel) {
		return <Target>[p.x - this.template.x1, p.y - this.template.y1];
	}
}
