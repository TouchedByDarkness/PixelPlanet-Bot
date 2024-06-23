import Emitter from './common/Emitter'

export type Options = Partial<{
	localStorageKey: string
}>

export type ValueMap = Record<string, any>

export type ValueKey<T extends ValueMap> = string & keyof T

export default class<T extends ValueMap> extends Emitter {
	private localStorageData: Record<string, any> = {}
	private data: Record<string, any> = {}
	private localStorageKey = 'storage'

	constructor(options: Options | undefined) {
		super();

		if (options) {
			if (options.localStorageKey) {
				this.localStorageKey = options.localStorageKey;
			}
		}

		this.load();
	}

	public set<K extends ValueKey<T>>(name: K, value: T[K], inLocalStorage = true) {
		if (
			inLocalStorage && name in this.data ||
			!inLocalStorage && name in this.localStorageData) {
			throw new Error(`try to duplicate field "${name}" with value "${value}"`);
		}

		if (inLocalStorage) {
			this.emit('beforeChangeLC.' + name, value);
			this.localStorageData[name] = value;
			this.save();
			this.emit('afterChangeLC.' + name, value);
		} else {
			this.emit('beforeChange.' + name, value);
			this.data[name] = value;
			this.emit('afterChange.' + name, value);
		}
	}

	public get<K extends ValueKey<T>>(name: K): T[K] | null {
		if (name in this.data) {
			return this.data[name];
		}

		if (name in this.localStorageData) {
			return this.localStorageData[name];
		}

		return null;
		// throw new Error(`no field named "${name}" in storage`);
	}

	// public safeGet<K extends ValueKey<T>>(name: K): T[K] | null {
	// 	if (name in this.data) {
	// 		return this.data[name];
	// 	}

	// 	if (name in this.localStorageData) {
	// 		return this.localStorageData[name];
	// 	}

	// 	return null;
	// }

	public has<K extends ValueKey<T>>(name: K) {
		return name in this.data || name in this.localStorageData;
	}

	private save() {
		if (Object.keys(this.localStorageData).length) {
			localStorage.setItem(this.localStorageKey, JSON.stringify(this.localStorageData));
		}
	}

	private load() {
		const json = localStorage.getItem(this.localStorageKey);
		if (json !== null) {
			this.localStorageData = JSON.parse(json);
		}
	}

	// public onBeforeChange(prop: string, handler: NodeJS.EventEmitter, inLocalStorage = true) {
	// 	if (inLocalStorage) {
	// 		this.on('beforeChangeLC.' + prop, handler);
	// 	} else {
	// 		this.on('beforeChange.' + prop, handler);
	// 	}
	// }
	
	// public onAfterChange(prop: string, handler: NodeJS.EventEmitter, inLocalStorage = true) {
	// 	if (inLocalStorage) {
	// 		this.on('afterChangeLC.' + prop, handler);
	// 	} else {
	// 		this.on('afterChange.' + prop, handler);
	// 	}
	// }
}