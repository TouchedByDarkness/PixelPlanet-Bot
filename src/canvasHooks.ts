import SELECTORS from '../resources/selectors'
import { $, matchNumbers } from './functions'
import bus,{ EVENTS as APP_EVENTS } from './eventBus'

const errCantFindElement = new Error('errCantFindElement');
// const errHookError = new Error('error in canvas gui hooks');

window.addEventListener('mousemove', () => {
	const el = $(SELECTORS.coords);
	if(!el) {
		throw errCantFindElement;
	}

	const position = matchNumbers(el.textContent || '');
	if(position && position.length === 2) {
		bus.emit(APP_EVENTS.CHANGE_MOUSE_POSITION, [position[0], position[1]]);
	}
});