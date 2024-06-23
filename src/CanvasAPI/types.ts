import { Emitter, Rect, Vec2, RGB, AnyHandler, EmitterEvent, GoError } from '../Common'
import Timer from './Timer'
import CanvasAPI, { EventMap as ApiEventMap } from './CanvasAPI'

import { Captcha as PPFCaptcha, CaptchaSolution as PPFCaptchaSolution } from './PPF'

export type Pixel = {
	x: number
	y: number
	id: number
}

export type CanvasInfo = {
	id: number
	name: string
	palette: {
		offset: number
		colors: Array<RGB>
	}
	chunkWidth: number
	chunkHeight: number
	worldWidth: number
	worldHeight: number
	haveStack: boolean
	stack: number
	minCd: number
	maxCd: number
	borders: Rect
}

export const emptyCanvasInfo = <CanvasInfo> {
	id: -1,
	name: '',
	palette: {
		offset: 0,
		colors: [],
	},
	chunkWidth: 0,
	chunkHeight: 0,
	worldWidth: 0,
	worldHeight: 0,
	haveStack: false,
	stack: 0,
	minCd: 0,
	maxCd: 0,
	borders: new Rect(0, 0, 0, 0)
}

export type Captcha = PPFCaptcha

export type CaptchaSolution = PPFCaptchaSolution

export interface IEmitter {
	on (event: EmitterEvent, AnyHandler: AnyHandler): void
	off (event: EmitterEvent, handler: AnyHandler): void
	once (event: EmitterEvent, callback: AnyHandler): void
	emit (event: EmitterEvent, ...args: Array<any>): void
	wait (event: EmitterEvent): Promise<any>
}

export interface ILowLevelAPI {
	info: CanvasInfo
	timer: Timer
	emitter: Emitter<ApiEventMap>

	// init(): Promise<void>
	predictCooldown(x: number, y: number): number
	sendAnswer(answer: CaptchaSolution): Promise<boolean | Error>
	getCaptcha(): Promise<Captcha>
	prepareChunks(workspacesChunks: Array<Vec2>): Promise<void>
	dropChunks(workspacesChunks: Array<Vec2>): void
	getChunksCoords(x1: number, y1: number, x2: number, y2: number): Array<Vec2>
	get(x: number, y: number): number
	placePixels(pixels: Array<Pixel>): Promise<GoError>
	destroy(): Promise<void>
}

export type Workspace = {
	x1: number
	y1: number
	x2: number
	y2: number
	chunks: Array<Vec2>
}

export type LLABuilder = () => Promise<ILowLevelAPI>

export type CanvasAPIBuilder = () => Promise<CanvasAPI>