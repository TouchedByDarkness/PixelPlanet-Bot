export default class {
	private value = 0

	constructor(
		private max: number
	){}

	public get () {
		return this.value;
	}

	public inc(num = 1) {
		for(let i = 0; i !== num; i++)  {
			this.value++;
			if (this.value === this.max) {
				this.value = 0;
			}
		}
		return this.value;
	}

	public deinc () {
		this.value--;
		if (this.value === -1) {
			this.value = this.max - 1;
		}
		return this.value;
	}
}