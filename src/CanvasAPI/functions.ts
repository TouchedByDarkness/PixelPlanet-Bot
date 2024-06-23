import { Vec2, Emitter } from '../common'
import CanvasAPI, { EventMap as ApiEventMap } from './CanvasAPI'
import { ILowLevelAPI, CanvasInfo, Captcha, Pixel } from './types'
import { Chunks,  Chunk } from './Chunks'
import SuperAPI from './SuperAPI'

export const chunksEqual = (ch1: Vec2, ch2: Vec2) => ch1[0] === ch2[0] && ch1[1] === ch2[1];

export const includesChunks = (chs: Array<Vec2>, check: Vec2) => chs.some(ch => chunksEqual(ch, check));

export const fakeFrom = (api: CanvasAPI) => {
	const info = <CanvasInfo>JSON.parse(JSON.stringify(api.info));
	info.borders = api.info.borders.copy();

	const low = new class extends SuperAPI implements ILowLevelAPI {
		public info = info
		public emitter = new Emitter<ApiEventMap>()

		private chunks = new Chunks()

		public predictCooldown() {
			return 0;
		}

		public sendAnswer(): Promise<boolean | Error> {
			return Promise.resolve(true);
		}

		public getCaptcha() {
			return Promise.resolve(<Captcha>{});
		}

		public prepareChunks(chs: Array<Vec2>) {
			chs.forEach(([x, y]) => {
				const ch = new Chunk(new Uint32Array(this.chunkSize << 2));
				this.chunks.set(ch, x, y);
			});

			return Promise.resolve();
		}

		public dropChunks(chs: Array<Vec2>) {
			chs.forEach(([x, y]) => this.chunks.delete(x, y));
		}

		public get(x: number, y: number)  {
			const tiled = this.toTiled(x, y);
			// @ts-ignore
			return this.chunks.get(tiled[0], tiled[1]).get(tiled[2]);
		}

		public placePixels(pxls: Array<Pixel>) {
			pxls.forEach(pxl => {
				const tiled = this.toTiled(pxl.x, pxl.y);
				// @ts-ignore
				this.chunks.get(tiled[0], tiled[1]).set(tiled[2], pxl.id);
			});

			return Promise.resolve(null);
		}

		public destroy() {
			return Promise.resolve();
		}
	}

	return new CanvasAPI(low);
}