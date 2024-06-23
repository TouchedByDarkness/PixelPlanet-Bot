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
export function hydrateOnlineCounter(data) {
  const online = {};
  online.total = data.getUint16(1);
  let off = data.byteLength;
  while (off > 3) {
    const onlineUsers = data.getUint16(off -= 2);
    const canvas = data.getUint8(off -= 1);
    online[canvas] = onlineUsers;
  }
  return online;
}

/*
 * @return chunk coordinates and array of pixel offset and colors
 */
export function hydratePixelUpdate(data) {
  const i = data.getUint8(1);
  const j = data.getUint8(2);
  /*
   * offset and color of every pixel
   * 3 bytes offset
   * 1 byte color
   */
  const pixels = [];
  let off = data.byteLength;
  while (off > 3) {
    const color = data.getUint8(off -= 1);
    const offsetL = data.getUint16(off -= 2);
    const offsetH = data.getUint8(off -= 1) << 16;
    pixels.push([offsetH | offsetL, color]);
  }
  return {
    i, j, pixels,
  };
}

/*
 * @return cooldown in ms
 */
export function hydrateCoolDown(data) {
  return data.getUint32(1);
}

/*
 * @return see ui/placePixels
 */
export function hydratePixelReturn(data) {
  const retCode = data.getUint8(1);
  const wait = data.getUint32(2);
  const coolDownSeconds = data.getInt16(6);
  const pxlCnt = data.getUint8(8);
  const rankedPxlCnt = data.getUint8(9);
  return {
    retCode,
    wait,
    coolDownSeconds,
    pxlCnt,
    rankedPxlCnt,
  };
}

/*
 * @return code of captcha success
 */
export function hydrateCaptchaReturn(data) {
  return data.getUint8(1);
}

/*
 * dehydrate functions return ArrayBuffer object
 */

/*
 * @param canvasId
 */
export function dehydrateRegCanvas(canvasId) {
  const buffer = new ArrayBuffer(1 + 1);
  const view = new DataView(buffer);
  view.setInt8(0, REG_CANVAS_OP);
  view.setInt8(1, Number(canvasId));
  return buffer;
}

/*
 * @param chunkid
 */
export function dehydrateRegChunk(chunkid) {
  const buffer = new ArrayBuffer(1 + 2);
  const view = new DataView(buffer);
  view.setInt8(0, REG_CHUNK_OP);
  view.setInt16(1, chunkid);
  return buffer;
}

/*
 * @param chunkid
 */
export function dehydrateDeRegChunk(chunkid) {
  const buffer = new ArrayBuffer(1 + 2);
  const view = new DataView(buffer);
  view.setInt8(0, DEREG_CHUNK_OP);
  view.setInt16(1, chunkid);
  return buffer;
}

/*
 * @param chunks Array of chunkIds
 */
export function dehydrateRegMChunks(chunks) {
  const buffer = new ArrayBuffer(1 + 1 + chunks.length * 2);
  const view = new Uint16Array(buffer);
  // this will result into a double first byte, but still better than
  // shifting 16bit integers around later
  view[0] = REG_MCHUNKS_OP;
  for (let cnt = 0; cnt < chunks.length; cnt += 1) {
    view[cnt + 1] = chunks[cnt];
  }
  return buffer;
}

/*
 * @param chunks Array of chunkIds
 */
export function dehydrateDeRegMChunks(chunks) {
  const buffer = new ArrayBuffer(1 + 1 + chunks.length * 2);
  const view = new Uint16Array(buffer);
  // this will result into a double first byte, but still better than
  // shifting 16bit integers around later
  view[0] = DEREG_MCHUNKS_OP;
  for (let cnt = 0; cnt < chunks.length; cnt += 1) {
    view[cnt + 1] = chunks[cnt];
  }
  return buffer;
}

export function dehydratePing() {
  return new Uint8Array([PING_OP]).buffer;
}

/*
 * @param i, j chunk coordinates
 * @param pixels array of offsets and colors of pixels
 */
export function dehydratePixelUpdate(i, j, pixels) {
  const buffer = new ArrayBuffer(1 + 1 + 1 + pixels.length * 4);
  const view = new DataView(buffer);
  view.setUint8(0, PIXEL_UPDATE_OP);
  view.setUint8(1, i);
  view.setUint8(2, j);
  /*
   * offset and color of every pixel
   * 3 bytes offset
   * 1 byte color
   */
  let cnt = 2;
  let p = pixels.length;
  while (p) {
    p -= 1;
    const [offset, color] = pixels[p];
    view.setUint8(cnt += 1, offset >>> 16);
    view.setUint16(cnt += 1, offset & 0x00FFFF);
    view.setUint8(cnt += 2, color);
  }
  return buffer;
}