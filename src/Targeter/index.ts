import strategies from './strategies'
import Template from '../Template'
import { CanvasAPI } from '../CanvasAPI'
import SortingTargeter from './SortingTargeter'
import { SortingFunc, BasicTargeterBuilder } from './types'

export { ITargeter } from './types'
export { SortingFunc }
export { SortingTargeter }

// import Near from './DynamicNear'

export const basicTargeters: Record<string, BasicTargeterBuilder> = {};
for(const name in strategies) {
	basicTargeters[name] = (api: CanvasAPI, tmp: Template) => new SortingTargeter(api, tmp, strategies[name]);
}
// basicTargeters.near = (api: CanvasAPI, tmp: Template) => new Near(api, tmp);

export const createBasicTargeter = (api: CanvasAPI, tmp: Template, strategy: string | SortingFunc) => {
	if(typeof strategy === 'string') {
		if(strategy in basicTargeters) {
			return basicTargeters[strategy](api, tmp);
		} else {
			return undefined;
		}
	}

	return new SortingTargeter(api, tmp, strategy);
}