export class Chunks {
	private dict: Map<string, Chunk> = new Map()

	public get(x: number, y: number): Chunk | undefined {
		return this.dict.get(this.coordsToIndex(x, y))
	}

	public delete(x: number, y: number) {
		return this.dict.delete(this.coordsToIndex(x, y));
	}

	public has(x: number, y: number): boolean {
		return this.dict.has(this.coordsToIndex(x, y));
	}

	public set(ch: Chunk, x: number, y: number) {
		this.dict.set(this.coordsToIndex(x, y), ch);
	}

	public clear() {
		this.dict.clear();
	}

	private coordsToIndex(x: number, y: number): string {
		return y + '_' + x;
	}
}

export class Chunk {
	get length(): number {
		return this.data.length;
	}

	constructor(
		private data: Uint32Array
	) {}

	public get(i: number): number {
		return this.data[i];
	}

	public set(i: number, clr: number) {
		this.data[i] = clr;
	}
}