declare module 'events' {
	export type Event = number | string | symbol

	interface EventEmitterOptions {
		captureRejections?: boolean | undefined;
	}
	interface _NodeEventTarget {
		once(eventName: Event, listener: (...args: any[]) => void): this;
	}
	interface _DOMEventTarget {
		addEventListener(
			eventName: string,
			listener: (...args: any[]) => void,
			opts?: {
				once: boolean;
			}
		): any;
	}
	interface StaticEventEmitterOptions {
		signal?: AbortSignal | undefined;
	}
	interface EventEmitter extends NodeJS.EventEmitter {}
	class EventEmitter {
		constructor(options?: EventEmitterOptions);
		static once(emitter: _NodeEventTarget, eventName: Event, options?: StaticEventEmitterOptions): Promise<any[]>;
		static once(emitter: _DOMEventTarget, eventName: string, options?: StaticEventEmitterOptions): Promise<any[]>;
		static on(emitter: NodeJS.EventEmitter, eventName: string, options?: StaticEventEmitterOptions): AsyncIterableIterator<any>;
		static listenerCount(emitter: NodeJS.EventEmitter, eventName: Event): number;
		static getEventListeners(emitter: _DOMEventTarget | NodeJS.EventEmitter, name: Event): Function[];
		static setMaxListeners(n?: number, ...eventTargets: Array<_DOMEventTarget | NodeJS.EventEmitter>): void;
		static readonly errorMonitor: unique symbol;
		static readonly captureRejectionSymbol: unique symbol;
		static captureRejections: boolean;
		static defaultMaxListeners: number;
	}
	import internal = require('node:events');
	// namespace EventEmitter {
	// 	export { internal as EventEmitter };
	// 	export interface Abortable {
	// 		signal?: AbortSignal | undefined;
	// 	}
	// }
	global {
		namespace NodeJS {
			interface EventEmitter {
				addListener(eventName: Event, listener: (...args: any[]) => void): this;
				on(eventName: Event, listener: (...args: any[]) => void): this;
				once(eventName: Event, listener: (...args: any[]) => void): this;
				removeListener(eventName: Event, listener: (...args: any[]) => void): this;
				off(eventName: Event, listener: (...args: any[]) => void): this;
				removeAllListeners(event?: Event): this;
				setMaxListeners(n: number): this;
				getMaxListeners(): number;
				listeners(eventName: Event): Function[];
				rawListeners(eventName: Event): Function[];
				emit(eventName: Event, ...args: any[]): boolean;
				listenerCount(eventName: Event): number;
				prependListener(eventName: Event, listener: (...args: any[]) => void): this;
				prependOnceListener(eventName: Event, listener: (...args: any[]) => void): this;
				eventNames(): Array<Event>;
			}
		}
	}
	// export = EventEmitter;
}

// declare module 'node:events' {
// 	import events = require('events');
// 	export = events;
// }
