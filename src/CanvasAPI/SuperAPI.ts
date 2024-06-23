import Timer from './Timer'
import { CanvasInfo } from './types'
import { Vec2, Vec3 } from '../common'

export default abstract class {
	timer = new Timer()
	public abstract info: CanvasInfo

	protected get chunkSize() {
		return this.info.chunkWidth * this.info.chunkHeight;
	}

	public getChunksCoords(x1: number, y1: number, x2: number, y2: number) {
		x1 = Math.floor((x1 + this.info.worldWidth / 2) / this.info.chunkWidth);
		y1 = Math.floor((y1 + this.info.worldHeight / 2) / this.info.chunkHeight);
		x2 = Math.floor((x2 - 1 + this.info.worldWidth / 2) / this.info.chunkWidth);
		y2 = Math.floor((y2 - 1 + this.info.worldHeight / 2) / this.info.chunkHeight);

		const chunks: Array<Vec2> = [];
		for (let x = x1; x <= x2; x++) {
			for (let y = y1; y <= y2; y++) {
				chunks.push([x, y]);
			}
		}

		return chunks;
	}

	protected toTiled (x: number, y: number): Vec3 {
		x += this.info.worldWidth >> 1;
		y += this.info.worldHeight >> 1;
		return [
			Math.floor(x / this.info.chunkWidth), Math.floor(y / this.info.chunkHeight),
			y % this.info.chunkHeight * this.info.chunkWidth + x % this.info.chunkWidth];
	}

	protected toWorld(xch: number, ych: number, offset: number): Vec2 {
		return [
			xch * this.info.chunkWidth - (this.info.worldWidth >> 1) + offset % this.info.chunkWidth,
			ych * this.info.chunkHeight - (this.info.worldHeight >> 1) + Math.floor(offset / this.info.chunkWidth)];
	}
}