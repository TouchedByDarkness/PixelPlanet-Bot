/*
 * client package hydration
 */
import {
  REG_CANVAS_OP,
  REG_CHUNK_OP,
  DEREG_CHUNK_OP,
  REG_MCHUNKS_OP,
  DEREG_MCHUNKS_OP,
  PING_OP,
  PIXEL_UPDATE_OP,
} from './op';

import { ChunkPixel } from './types'
import { Vec2 } from '../../types'

/*
* data in hydrate functions is DataView
*/

/*
 * @return {
 *   total: totalOnline,
 *   canvasId: online,
 *   ....
 * }
 */
type OnlinePacket = {
  total: number
  0?: number
  1?: number
  2?: number
  3?: number
  4?: number
  5?: number
  6?: number
  7?: number
  8?: number
  9?: number
  10?: number
}
declare function hydrateOnlineCounter(data: DataView): OnlinePacket
/*
 * @return chunk coordinates and array of pixel offset and colors
 */
type Offset = number
type ColorId = number
type PixelUpdatePacket = {
  i: number
  j: number
  pixels: Array<[Offset, ColorId]>
}
declare function hydratePixelUpdate(data: DataView): PixelUpdatePacket

/*
 * @return cooldown in ms
 */
declare function hydrateCoolDown(data: DataView): number

/*
 * @return see ui/placePixels
 */
type PixelReturnPacket = {
  retCode: number
  wait: number
  coolDownSeconds: number
  pxlCnt: number
  rankedPxlCnt: number
}
declare function hydratePixelReturn(data: DataView): PixelReturnPacket

/*
 * @return code of captcha success
 */
declare function hydrateCaptchaReturn(data: DataView): number

/*
 * dehydrate functions return ArrayBuffer object
 */

/*
 * @param canvasId
 */
declare function dehydrateRegCanvas(canvasId: number): ArrayBuffer

/*
 * @param chunkid
 */
declare function dehydrateRegChunk(chunkid: number): ArrayBuffer

/*
 * @param chunkid
 */
declare function dehydrateDeRegChunk(chunkid: number): ArrayBuffer

/*
 * @param chunks Array of chunkIds
 */
declare function dehydrateRegMChunks(chunks: Array<number>): ArrayBuffer

/*
 * @param chunks Array of chunkIds
 */
declare function dehydrateDeRegMChunks(chunks: Array<number>): ArrayBuffer

declare function dehydratePing(): ArrayBuffer

/*
 * @param i, j chunk coordinates
 * @param pixels array of offsets and colors of pixels
 */
declare function dehydratePixelUpdate(i: number, j: number, pixels: Array<Vec2>): ArrayBuffer