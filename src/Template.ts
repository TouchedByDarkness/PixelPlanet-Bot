import { loadImage } from './functions'
import { Rect, RGB } from './common'
import Palette from './Palette'

export type Options = {
	name: string
	x: number
	y: number
	width?: number
	height?: number
}

export default class Template extends Rect {
	static readonly UNLOADED = 0
	static readonly LOADING = 1
	static readonly LOADED = 2
	static readonly QUANTIZED = 3

	public name: string
	public readyState: 0 | 1 | 2 | 3 = Template.UNLOADED

	public ctx: CanvasRenderingContext2D | null = null
	private ids: Uint8Array = new Uint8Array(0)

	public get canvas() {
		return this.ctx?.canvas;
	}

	public get size() {
		return this.width * this.height;
	}

	constructor(opts: Options) {
		super(
			opts.x, opts.y,
			opts.x + (opts.width || 0),
			opts.y + (opts.height || 0));
		this.name = opts.name;
	}

	public get(x: number, y: number) {
		return this.ids[x + y * this.width];
	}

	public isTransparent(x: number, y: number) {
		return this.get(x, y) === 255;
	}

	public isOutline (x: number, y: number) {
		const clr = this.get(x, y);
		return (
			this.get(x - 1, y - 1) !== clr ||
			this.get(x - 1, y) !== clr ||
			this.get(x - 1, y + 1) !== clr ||
			this.get(x, y - 1) !== clr ||
			this.get(x, y + 1) !== clr ||
			this.get(x + 1, y - 1) !== clr ||
			this.get(x + 1, y) !== clr ||
			this.get(x + 1, y + 1) !== clr);
	}

	public intersects(x1: number, y1: number, x2: number, y2: number) {
		return (
			this.x1 < x2 &&
			this.x2 > x1 &&
			this.y1 < y2 &&
			this.y2 > y1);
	}

	public load(src: string) {
		this.readyState = Template.LOADING;
		return loadImage(src).then(img => {
			this.ctx = <CanvasRenderingContext2D>document.createElement('canvas').getContext('2d');
			this.ctx.canvas.width = this.width = img.width;
			this.ctx.canvas.height = this.height = img.height;
			this.ctx.drawImage(img, 0, 0);
			this.readyState = Template.LOADED;
			return this;
		});
	}

	public quantize(palette: Palette) {
		if(!this.ctx) {
			throw new Error('template unloaded');
		}

		const id = this.ctx.getImageData(0, 0, this.width, this.height);
		const data = id.data;
		this.ids = new Uint8Array(data.length >> 2);

		const cache = new Map<number, number>();

		for(let i = 0; i !== data.length; i+=4){
			if(data[i | 3] === 0) {
				this.ids[i >> 2] = 255;
				data[i | 0] = data[i | 1] = data[i | 2] = data[i | 3] = 0;
			} else {
				const hash = data[i | 0] << 16 | data[i | 1] << 8 | data[i | 2];

				let clr = cache.get(hash);
				if(!clr) {
					clr = palette.convert(hash >> 16, hash >> 8 & 255, hash & 255);
					cache.set(hash, clr);
				}

				this.ids[i >> 2] = clr;

				const rgb = <RGB>palette.idToRGB(clr);
				data[i | 0] = rgb[0];
				data[i | 1] = rgb[1];
				data[i | 2] = rgb[2];
				data[i | 3] = 255;
			}
		}

		this.ctx.putImageData(id, 0, 0);

		this.readyState = Template.QUANTIZED;

		return this;
	}
}