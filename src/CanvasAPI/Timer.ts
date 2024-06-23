export default class {
	private updatedAt = 0
	private cooldown = 0

	public update(cooldown: number) {
		this.cooldown = cooldown;
		this.updatedAt = Date.now();
	}

	public get() {
		return Math.max(0, this.cooldown - (Date.now() - this.updatedAt));
	}
}