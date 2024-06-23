import { uniqueSelector } from '../src/functions'

export default {
	"selectedColor": ".selected",
	"coords": ".coorbox",
	"gameCanvas": ".viewport",
	"bot": {
		"void-bot": uniqueSelector(),
		"half": uniqueSelector(),
		"color-box": uniqueSelector()
	}
}