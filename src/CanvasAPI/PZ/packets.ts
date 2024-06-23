import {

} from './op'

export const deserializeOnline = (v: DataView) => v.getUint8(1) | v.getUint8(2) << 8 | v.getUint8(3) << 16;

type PixelIndex = number
type ColorId = number
export type PixelPacket = Array<[PixelIndex, ColorId]>

export const deserializePixels = (view: DataView): PixelPacket => {
	const pixels: PixelPacket = new Array(Math.trunc((view.byteLength - 1) / 5));
	for(let i = 0; i !== pixels.length; i++) {
		const j = 5 * i;
		pixels[i] = [
			view.getUint8(j + 1) | 
			view.getUint8(j + 2) << 8 |
			view.getUint8(j + 3) << 16 |
			view.getUint8(j + 4) << 24,
			view.getUint8(j + 5)];
	}
	return pixels
}

export const deserializePixelCount = (view: DataView) => view.getUint8(1)

export type CaptchaPacket = {
	data: ArrayBuffer,
	model: ArrayBuffer
}

const _e = 6;
const mt = 32 / 6 * _e;
export const deserializeCaptcha = (view: DataView) => ({
	data: view.buffer.slice(1, _e * mt * mt / 4 + 1),
	model: view.buffer.slice(_e * mt * mt / 4 + 1, _e * mt * mt / 2 + 1)
});

export const deserializeCaptchaStatus = (view: DataView) => view.getUint8(1);

export const deserializePenalty = (view: DataView) => view.getUint8(1);