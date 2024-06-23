import { Solver } from './Solver'
import { ITargeter, ErrorsInfo } from './Targeter/types'
import { CanvasAPI, errors } from './CanvasAPI'
import { notify, sleep, since, randDuration } from './functions'
import { BOT_OPTIONS as DEFAULT_BOT_OPTIONS } from './defaults'
import {
	errAborterTriggered,
	errSeveralNoPlacePixelResult,
	Emitter,
	Aborter,
	GoError,
	GoDuration,
} from './common'

const Info = new class {
	Println(...args: Array<any>) {
		console.log('[INFO] ', ...args);
	}
}

const Trace = new class {
	Println(...args: Array<any>) {
		console.debug('[TRACE] ', ...args);
	}
}

const Warn = new class {
	Println(...args: Array<any>) {
		console.warn('[TRACE] ', ...args);
	}
}

export enum EVENTS {
	BOT_PROGRESS_INFO,
	CAPTCHA,
	LOOP_END
}

export type EventMap = {
	[EVENTS.BOT_PROGRESS_INFO]: ErrorsInfo,
	[EVENTS.CAPTCHA]: void,
	[EVENTS.LOOP_END]: void
}

export type Options = {
	smartPlace: boolean
	showErrors: boolean
}

export enum STATUSES {
	IDLE,
	STOPPING,
	WORKS,
}

export default class Bot extends Emitter<EventMap> {
	public status: STATUSES = STATUSES.IDLE
	// public works = false
	private pings: Array<number> = [100]
	private noRetcodeInRow = 0
	private captchaEmitted = false
	private targeterToSet: ITargeter | null = null
	private placingAborter: Aborter | null = null
	private loopAborter: Aborter | null = null

	constructor(
		private api: CanvasAPI,
		private targeter: ITargeter,
		private solver: Solver | null,
		private options = DEFAULT_BOT_OPTIONS
	) {
		super();
	}

	public start(): Promise<GoError> {
		this.status = STATUSES.WORKS;
		return this.loop();
	}

	public stop() {
		if(this.status === STATUSES.IDLE) {
			return;
		}

		if(this.status === STATUSES.STOPPING) {
			return this.wait(EVENTS.LOOP_END);
		}

		this.status = STATUSES.STOPPING;
		this.abortPlacing();
		this.abortLoop();
		return this.wait(EVENTS.LOOP_END);
	}

	public changeTargeter(targeter: ITargeter) {
		this.abortPlacing();
		this.targeterToSet = targeter;
	}

	private async loop(): Promise<GoError> {
		this.emit(EVENTS.BOT_PROGRESS_INFO, this.targeter.countErrors());

		while (this.status === STATUSES.WORKS) {
			if(this.targeterToSet !== null) {
				this.targeter = this.targeterToSet;
				this.targeterToSet = null;
			}

			const [delay, text, err] = await this.iteration();
			if(err) {
				return err;
			}

			// @ts-ignore
			if(this.status !== STATUSES.WORKS) {
				break;
			}

			Info.Println(`next tick after ${delay.toString()} :: ${text}`);

			this.loopAborter = new Aborter();
			await Promise.any([sleep(delay), this.loopAborter.promise]);
			if(this.loopAborter) {
				this.loopAborter.destroy();
				this.loopAborter = null;
			}
		}

		this.status = STATUSES.IDLE;
		this.emit(EVENTS.LOOP_END);
		return null;
	}

	private async iteration(): Promise<[GoDuration, string, GoError]> {
		// bad works at ppf when win event
		const cd = this.api.info.minCd;
		const max = this.api.pixelsCanPlace();

		if (this.api.info.haveStack && max <= 1 || max === 0) {
			const totalCd = this.api.getCooldown()
			let delay: GoDuration = 0
			if (totalCd < cd) {
				delay = totalCd;
			} else {
				delay = totalCd - randDuration(0, cd);
			}
			return [delay, "cooldown", null];
		}

		const pixels = this.targeter.nexts(max);
		if (pixels.length === 0) {
			return [
				randDuration(3e3, Math.min(5 * cd, this.api.info.stack)),
				"no pixels to place", null];
		} else {
			Trace.Println("place", pixels.map(p => `[${p.x}_${p.y} ${p.id}]`).join(', '));

			let err: GoError = null;
			if (this.options.smartPlace) {
				this.placingAborter = new Aborter();
				try {
					[, err] = await this.api.smartPlace(pixels, this.placingAborter);
				} catch(e) {
					console.log(e);
				} finally {
					if(this.placingAborter) {
						this.placingAborter.destroy();
						this.placingAborter = null;
					}
				}
			} else {
				const timeBeforePlace = Date.now();
				err = await this.api.placePixels(pixels);
				const ping = since(timeBeforePlace);
				this.registerPing(ping);
				Trace.Println('place ping', ping);
			}

			if (err === errors.errNoPlacePixelResult) {
				this.noRetcodeInRow++;

				if (this.noRetcodeInRow >= 3) {
					return [0, "", errSeveralNoPlacePixelResult];
				}

				Warn.Println(errors.errNoPlacePixelResult);
			} else if(err === errors.errParallelPlace) {
				Warn.Println(err);
			} else {
				this.noRetcodeInRow = 0;
			}

			switch(err) {
				case null:
					this.captchaEmitted = false;
					break;
				case errAborterTriggered:
					// no need handle (i hope)
					break;
				case errors.errNoPlacePixelResult:
					// already handled above
					break;
				case errors.errFullStack:
					Warn.Println("unexpected cooldown", this.api.getCooldown());
					break;
				case errors.errPixelProtected:
					Warn.Println("protected pixel");
					notify("protected pixel, maybe admins catch you");
					break;
				case errors.errCaptcha:
					if (this.solver === null) {
						if (!this.captchaEmitted) {
							this.emit(EVENTS.CAPTCHA);
							this.captchaEmitted = true;
						}
					} else {
						while(true) {
							Info.Println("have captcha");

							const captcha = await this.api.getCaptcha();
							if (err) {
								return [0, "", err];
							}
							Info.Println("captcha loaded, send to solver...");
							
							const solution = await this.solver.solve(captcha);
							Info.Println(`answer from solver "${solution}", send to canvas...`);

							const result = await this.api.sendAnswer(solution);
							if(result instanceof Error) {
								return [0, "", result];
							}

							if (result) {
								Info.Println("solution is right")
								break
							} else {
								Info.Println("solution is wrong, try again...")
							}
						}
					}

					return [6e3, `tried place ${pixels.length} pixels with CAPTCHA`, null];
				default:
					return [0, "", err];
			}

			// к этому моменту ОБЯЗАТЕЛЬНО должен обновиться кд у апи
			const errorsInfo = this.targeter.countErrors();
			this.emit(EVENTS.BOT_PROGRESS_INFO, errorsInfo);
			const text = this.options.showErrors ? `left ${errorsInfo.errors} errors` : 'pass';
			return [50, text, null];
		}
	}

	private abortPlacing() {
		if(this.placingAborter) {
			Info.Println('stop bot placing with aborter');
			this.placingAborter.abort();
		}
	}

	private abortLoop() {
		if(this.loopAborter) {
			Info.Println('stop bot loop with aborter');
			this.loopAborter.abort();
		}
	}

	private registerPing(ping: GoDuration) {
		if (this.pings.length >= 5) {
			this.pings.shift();
		}
		this.pings.push(ping);
	}

	// private getAveragePing(): GoDuration {
	// 	return this.pings.reduce((a, b) => a + b, 0) / this.pings.length;
	// }
}