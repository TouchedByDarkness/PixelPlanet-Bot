export type EmitterEvent = number | string | symbol

export type AnyHandler = (...args: Array<any>) => void

export type Vec4 = [number, number, number, number]

export type Vec3 = [number, number, number]

export type RGB = Vec3

export type Vec2 = [number, number]

export type GoError = Error | null

export type GoDuration = number

export interface Stringer {
	toString(): string
}