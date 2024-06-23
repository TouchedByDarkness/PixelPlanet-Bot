import Emitter from './Emitter'

type Key = number | symbol;

export type EventMap = Record<Key, any>;

export type EventKey<T extends EventMap> = Key & keyof T;

export type EventHandler<T> = (params: T) => void;

interface IEmitter<T extends EventMap> {
	on<K extends EventKey<T>> (eventName: K, fn: EventHandler<T[K]>): void;
	once<K extends EventKey<T>> (eventName: K, fn: EventHandler<T[K]>): void;
	wait<K extends EventKey<T>> (eventName: K, timeout?: number): Promise<Array<T[K]>>;
	off<K extends EventKey<T>> (eventName: K, fn: EventHandler<T[K]>): void;
	emit<K extends EventKey<T>> (eventName: K, params: T[K]): void;
}

export default class<T extends EventMap> extends Emitter implements IEmitter<T> {
	public on<K extends EventKey<T>>(eventName: K, fn: EventHandler<T[K]>) {
		return super.on(eventName, fn);
	}

	public once<K extends EventKey<T>>(eventName: K, fn: EventHandler<T[K]>) {
		return super.once(eventName, fn);
	}

	public wait<K extends EventKey<T>>(event: K, timeout?: number): Promise<T[K]> {
		return super.wait(event, timeout);
	}

	public off<K extends EventKey<T>>(eventName: K, fn: EventHandler<T[K]>) {
		return super.off(eventName, fn);
	}

	public emit<K extends EventKey<T>>(eventName: K, params?: T[K]) {
		if(params !== undefined) {
			return super.emit(eventName, params);
		} else {
			return super.emit(eventName);
		}
	}
}