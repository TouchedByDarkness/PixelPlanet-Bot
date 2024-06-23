import Storage from './Storage'
import { AsyncSingleton } from './common'
import Template from './Template'
import Bot from './Bot'
import { ITargeter } from './Targeter'
import { CanvasAPI } from './CanvasAPI'


export default <{
	storage: Storage<{
		'template.x': number,
		'template.y': number,
		'template.src': string,
		'strategy': string,
		'stopOnCaptcha': boolean,
		'window.x': number,
		'window.y': number,
		'debug.x': number,
		'debug.y': number
	}>,
	bot: AsyncSingleton<Bot>,
	targeter: AsyncSingleton<ITargeter>
	api: AsyncSingleton<CanvasAPI>,
	template: AsyncSingleton<Template>,
}>{};