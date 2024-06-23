import SELECTORS from './selectors'
import cssOriginal from '!!raw-loader!./style.css'

let css = cssOriginal;
Object.entries(SELECTORS.bot).forEach(([selector, hash]) => {
	css = css.replace(new RegExp(selector, 'g'), hash);
});
export default css;