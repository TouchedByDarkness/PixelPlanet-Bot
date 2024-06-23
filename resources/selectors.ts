import { uniqueSelector } from '../src/functions'

export const bot = {
	"void-bot": uniqueSelector(),
	"half": uniqueSelector(),
	"color-box": uniqueSelector()
}

export const canvases = {
	ppf: {
		// "selectedColor": ".selected",
		"coords": ".coorbox",
		"gameCanvas": ".viewport"
	}
}


// export const pz = {
// 	// "selectedColor": "",
// 	"coords": 'svg ~ .notranslate',
// 	"gameCanvas": "#root canvas"
// }