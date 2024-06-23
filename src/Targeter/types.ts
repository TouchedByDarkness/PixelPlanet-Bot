import { Pixel } from '../CanvasAPI/types'
import { Vec2 } from '../common'
import Template from '../Template'

export type Target = Vec2

export interface ITargeter {
	get width(): number
	get height(): number
	nexts(amount: number): Array<Pixel>
	countErrors(): ErrorsInfo
	countTargets(): number
}

export type ErrorsInfo = {
	errors: number,
	timeToEnd: number | Vec2
}

export type SortingFunc = (template: Template) => Array<Target>