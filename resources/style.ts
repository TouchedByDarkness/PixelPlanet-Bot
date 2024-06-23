import { bot } from './selectors'
import cssOriginal from '!!raw-loader!./style.css'

let css = cssOriginal;
Object.entries(bot).forEach(([selector, hash]) => {
	css = css.replace(new RegExp(selector, 'g'), hash);
});
export default css;