import { Pixel } from './CanvasAPI/types'
import { Emitter, Vec2 } from './common'
import { ErrorsInfo } from './Targeter/types'

export enum EVENTS {
	FOCUS,
	BLUR,
	CHANGE_TEMPLATE_SRC,
	CHANGE_TEMPLATE_X,
	CHANGE_TEMPLATE_Y,
	SWITCH_BOT,
	CHANGE_STRATEGY,
	CHANGE_MOUSE_POSITION,
	BOTTING_ERROR,
	BOT_PROGRESS_INFO,
	PLACE_PIXELS,
	PIXELS,
	CHANGE_STOP_ON_CAPTCHA,
	CAPTCHA,
	SHOW_HEATMAP
}

export default new Emitter<{
	[EVENTS.FOCUS]: void,
	[EVENTS.BLUR]: void,
	[EVENTS.CHANGE_TEMPLATE_SRC]: string,
	[EVENTS.CHANGE_TEMPLATE_X]: number,
	[EVENTS.CHANGE_TEMPLATE_Y]: number,
	[EVENTS.SWITCH_BOT]: void,
	[EVENTS.CHANGE_STRATEGY]: string,
	[EVENTS.CHANGE_MOUSE_POSITION]: Vec2,
	[EVENTS.BOTTING_ERROR]: Error,
	[EVENTS.BOT_PROGRESS_INFO]: ErrorsInfo | null,
	[EVENTS.PLACE_PIXELS]: Array<Pixel>
	[EVENTS.PIXELS]: Array<Pixel>
	[EVENTS.CHANGE_STOP_ON_CAPTCHA]: boolean
	[EVENTS.CAPTCHA]: void
	[EVENTS.SHOW_HEATMAP]: void
}>();