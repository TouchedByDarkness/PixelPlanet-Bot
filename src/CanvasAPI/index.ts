import CanvasAPI from './CanvasAPI'
import ppf from './PPF'
import { CanvasAPIBuilder } from './types'
import { list as CANVASES, names as NAMES } from './canvases'
import errors from './errors'

export * from './types'
export { EVENTS } from './CanvasAPI';
export { fakeFrom } from './functions'

export { CanvasAPI, CANVASES, NAMES, errors }

export const builders: Record<string, CanvasAPIBuilder> = {};
Object.entries(ppf).forEach(([canvas, build]) => {
	builders[canvas] = () => build().then(api => new CanvasAPI(api));
});

export const CANVASES_LIST = Object.keys(builders);

export const create = (canvas: number) => builders[canvas]();