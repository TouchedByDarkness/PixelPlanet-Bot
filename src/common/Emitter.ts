// import Emitter, { EventKey, Handler } from 'events-light'
import  Emitter, { Event } from 'events'
import { errPromiseDeadline } from './errors'

export default class extends Emitter {
	public wait(event: Event, deadline = 5e3): Promise<any> {
		return new Promise((resolve, reject) => {
			const id = setTimeout(() => reject(errPromiseDeadline), deadline);
			this.once(event, (data: any) => {
				clearTimeout(id);
				resolve(data);
			});
		});
	}
}