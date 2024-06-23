import { errAborterTriggered } from './errors'

export default class {
	public triggered = false
	public promise: Promise<Error>
	private timeout: NodeJS.Timeout
	private resolve: Function = () => {}

	constructor(deadline = 60e3) {
		this.timeout = setTimeout(() => this.destroy(), deadline);
		this.promise = new Promise(r => this.resolve = r);
	}

	public abort() {
		this.resolve(errAborterTriggered);
		clearTimeout(this.timeout);
		this.triggered = true;
	}

	public destroy() {
		this.resolve();
		clearTimeout(this.timeout);
	}
}