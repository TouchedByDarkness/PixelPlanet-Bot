import { RGB, Vec2 } from './common'
import { sq } from './functions'

export default class {
	private ids
	private monochromes: Array<number>
	private singleColorIds: Record<number, number>

	constructor (
		public offset: number,
		public colors: Array<RGB>
	) {
		this.monochromes = this.colors.map(color => color.reduce((a, b) => a + b) / 3);

		this.ids = Object.fromEntries(this.colors.map((color, i) => ([color.toString(), i])));

		this.singleColorIds = Object.fromEntries(
			this.colors
				.map((color: RGB, id: number): Vec2 => ([
					id,
					this.colors.findIndex((rgb2, id2) => id !== id2 && color.every((x, i) => x === rgb2[i]))
				]))
				.filter(([, haveTwin]: [any, number]): boolean => haveTwin !== -1));
	}

	public monochrome(id: number) {
		return this.monochromes[id];
	}

	public sameIds (f: number, s: number) {
		return f === s || this.singleColorIds[f] === s;
	}

	public same (f: RGB, s: RGB, range = 15): boolean {
		return Math.abs(f[0] - s[0]) < range && Math.abs(f[1] - s[1]) < range && Math.abs(f[2] - s[2]) < range;
	}

	public strictSame (a: RGB, b: RGB): boolean {
		return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
	}

	public has (x: RGB): boolean {
		return this.rgbToId(x) !== undefined;
	}

	public idToRGB (id: number): RGB | undefined {
		return this.colors[id];
	}

	public convert (r: number, g: number, b: number): number {
		let nearIndex = 0;
		let nearD = Infinity;
		for (let i = this.offset; i !== this.colors.length; i++) {
			const p = this.colors[i];
			const d = sq(p[0] - r) + sq(p[1] - g) + sq(p[2] - b);

			if (d === 0) {
				return i;
			} else if (d < nearD) {
				nearD = d;
				nearIndex = i;
			}
		}

		return nearIndex;
	}

	rgbToId (color: RGB): number | null {
		return this.ids[color.toString()] || null;
	}
}