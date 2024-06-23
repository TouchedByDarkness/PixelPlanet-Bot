import { CanvasAPI } from '../CanvasAPI'
import Template from '../Template'

export default class {
	constructor(
		protected api: CanvasAPI,
		protected template: Template
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
}
