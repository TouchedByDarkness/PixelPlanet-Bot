import strategies from './strategies'
import Template from '../Template'
import { CanvasAPI } from '../CanvasAPI'
import SortingTargeter from './SortingTargeter'
import { SortingFunc } from './types'

export { ITargeter } from './types'
export { SortingFunc }
export { SortingTargeter }

export type availableStrategies = keyof typeof strategies;

export const sortings = strategies;

export const createSortingTargeter = (api: CanvasAPI, tmp: Template, strategy: string | SortingFunc) => {
	if(typeof strategy === 'string') {
		if(strategy in strategies) {
			strategy = strategies[strategy];
		} else {
			return undefined;
		}
	}

	return new SortingTargeter(api, tmp, strategy);
}