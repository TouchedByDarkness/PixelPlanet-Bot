import Aborter from './Aborter'

interface Destroyable {
	destroy: Function
}

export default class<T extends Object | Destroyable> {
	private instance: T | Promise<T | null> | null = null
	private aborter: Aborter | null = null

	constructor(
		private build: () => Promise<T | null>,
		private onerror?: (e: Error) => void
	) {}

	get ready() {
		return this.instance !== null && !(this.instance instanceof Promise);
	}

	public async clear() {
		let promise: Promise<void> | undefined;

		if(this.instance instanceof Promise) {
			promise = this.instance
				.then(i => {
					if(i && 'destroy' in i) {
						return i.destroy();
					}
				})
				.then(() => {});
			this.instance = null;

			this.aborter?.abort();
			this.aborter = null;
		}

		if(this.instance !== null) {
			this.instance = null;
		}

		return promise || Promise.resolve();
	}

	public get() {
		if(this.instance === null) {
			this.aborter = new Aborter();
			return this.instance = Promise.any([
				this.build()
					.then(i => this.instance = i)
					.catch(e => (this.onerror && this.onerror(e), null)),
				this.aborter.promise.then(() => null)]);
		}

		if(this.instance instanceof Promise) {
			return this.instance;
		}

		return Promise.resolve(this.instance);
	}

	// no initialization
	public getExists() {
		return Promise.resolve(this.instance);
	}

	public now() {
		if(this.instance === null || this.instance instanceof Promise) {
			return null;
		}

		return this.instance;
	}

	// public ifExists<F extends (instance: T) => any>(handler: F): Promise<ReturnType<F> | void> {
	// 	return this.getExists().then(i => {
	// 		if(i) {
	// 			return handler(i);
	// 		}
	// 	});
	// }
}