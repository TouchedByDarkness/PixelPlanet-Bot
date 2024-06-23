import { Vec2, Vec4 } from './types'

export default class Rect {
	public get width() {
		return this.x2 - this.x1;
	}

	public set width(width: number) {
		this.x2 = this.x1 + width;
	}

	public get height() {
		return this.y2 - this.y1;
	}

	public set height(height: number) {
		this.y2 = this.y1 + height;
	}

	public get localCenter(): Vec2 {
		return [this.width / 2, this.height / 2];
	}

	public get center(): Vec2 {
		return [(this.x1 + this.x2) / 2, (this.y1 + this.y2) / 2];
	}

	constructor(
		public x1: number,
		public y1: number,
		public x2: number,
		public y2: number){}

	public in(x: number, y: number) {
		return this.x1 <= x && x < this.x2 && this.y1 <= y && y < this.y2;
	}

	public toArray(): Vec4 {
		return [this.x1, this.y1, this.x2, this.y2];
	}

	public moveY(y: number) {
		this.move(this.x1, y);
	}

	public moveX(x: number) {
		this.move(x, this.y1);
	}

	public move(x: number, y: number) {
		const width = this.width;
		const height = this.height;
		this.x1 = x;
		this.y1 = y;
		this.width = width;
		this.height = height;
	}

	public copy() {
		return new Rect(this.x1, this.y1, this.x2, this.y2);
	}
}