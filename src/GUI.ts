import { mk, confuseString, hash, makeDraggable } from './functions'
import SELECTORS from '../resources/selectors'
import style from '../resources/style'
import bus, { EVENTS as APP_EVENTS } from './eventBus'
import global from './global'
import {
	STRATEGY as DEFAULT_STRATEGY,
	STOP_ON_CAPTCHA as DEFAULT_STOP_ON_CAPTCHA,
	WINDOW_POS as DEFAULT_WIN_POS
} from './defaults'
import { Vec3 } from './common'
import htmlConsole from 'console-log-html'

let debug = false;

const hash2value = new Map<string, string>();
const defaultStrategyHash = hash(DEFAULT_STRATEGY).toString();
hash2value.set(defaultStrategyHash, DEFAULT_STRATEGY);

export default class {
	public root
	private left
	private right
	private botOnline
	private botStatusElement
	private timerElement
	private errorsAmount
	private progress
	private buildPredict
	private placedPixel
	private placedPixelColor
	private strategyElement
	private xInput: HTMLInputElement
	private yInput: HTMLInputElement
	private captchaStop: HTMLInputElement
	private console
	private title

	constructor() {
		if(debug) {
			this.console = document.body.appendChild(mk('div', {
				style: `
					position: absolute;
					left: 72px;
					top: 72px;
					background: black;
					color: red;
					max-height: 35%;
					max-width: 50%;
					overflow-y: scroll;`
			}, [
				mk('div', {
					style: 'width: 100%; height: 20px; background: rgb(64, 64, 64); cursor: move;'
				}),
				mk('ul', {

				})
			]));
			makeDraggable(<HTMLElement>this.console.firstChild, this.console);
			htmlConsole.connect(<HTMLElement>this.console.querySelector('ul'));
		}

		this.root = mk('div', {
			id: SELECTORS.bot['void-bot'],
			style: `
				top: ${global.storage.get('window.y') ?? DEFAULT_WIN_POS[1]}px;`
		}, [
			this.title = mk('div', {
				style: 'font-size: 110%; cursor: move;',
				breakText: true,
				text: 'Make Void great again!'
			}),
			mk('hr', {
				style: 'border-color: darkred; margin: 3px 0px 3px 0px;'
			}),
			this.left = mk('div', {
				class: SELECTORS.bot['half'],
				style: 'float: left;'
			}),
			this.right = mk('div', {
				class: SELECTORS.bot['half'],
				style: 'float: right;'
			})
		]);

		this.right.appendChild(
			mk('div', {
				breakText: true,
				text: 'online: '
			}, [
				this.botOnline = mk('span', {
					text: 'null'
				})
			])
		);

		this.right.appendChild(
			mk('div', {
				breakText: true,
				text : 'status: '
			}, [
				this.botStatusElement = mk('span')]));

		this.right.appendChild(
			mk('div', {
				breakText: true,
				text : 'cooldown: '
			}, [
				this.timerElement = mk('span')]));
		
		this.right.appendChild(
			mk('div', {
				breakText: true,
				text : 'errors: '
			}, [
				this.errorsAmount = mk('span', {
					text : '?'
				})
			])
		);

		this.right.appendChild(
			mk('div', {
				breakText: true,
				text : 'progress: '
			}, [
				this.progress = mk('span', {
					text : '?'
				})
			])
		);

		this.right.appendChild(
			mk('div', {
				breakText: true,
				text : 'end in: '
			}, [
				this.buildPredict = mk('span', { text : '?' })
			])
		);
		
		this.right.appendChild(
			mk('div', {
				breakText: true,
				text: 'placed: '
			}, [
				this.placedPixel = mk('span', {
					breakText: true,
					text: 'x y'
				}),
				this.placedPixelColor = mk('span', {
					class: SELECTORS.bot['color-box']
				})
			])
		);

		this.left.appendChild(
			mk('div', {}, [
				mk('span', { text: 'x: ' }, [
					this.xInput = mk('input', {
						listeners: {
							input: () => bus.emit(APP_EVENTS.CHANGE_TEMPLATE_X, +this.xInput.value)
						},
						attributes: {
							type: 'number',
							value: global.storage.get('template.x')?.toString() || ''
						}
					})
				]),
				mk('span', { text: 'y: ' }, [
					this.yInput = mk('input', {
						listeners: {
							input: () => bus.emit(APP_EVENTS.CHANGE_TEMPLATE_Y, +this.yInput.value)
						},
						attributes: {
							type: 'number',
							value: global.storage.get('template.y')?.toString() || ''
						}
					})
				])
			])
		);

		this.left.appendChild(
			mk('div', {
				breakText: true,
				text: 'strategy: '
			},[
				this.strategyElement = mk('select', {
					listeners: {
						change: () => {
							const strategy = hash2value.get(this.strategyElement.value);
							if(strategy) {
								bus.emit(APP_EVENTS.CHANGE_STRATEGY, strategy);
							} else {
								console.warn(
									`cant define strategy for hash "${this.strategyElement.value}"\n` +
									`use default ("${DEFAULT_STRATEGY}")`);
								bus.emit(APP_EVENTS.CHANGE_STRATEGY, DEFAULT_STRATEGY);
							}
						}
					}
				})
			])
		);

		this.left.appendChild(mk('div', {}, [
			this.captchaStop = mk('input', {
				attributes: { type: 'checkbox' },
				listeners: {
					click: () => bus.emit(APP_EVENTS.CHANGE_STOP_ON_CAPTCHA, this.captchaStop.checked)
				}
			}),
			mk('span', { breakText: true, text: 'stop on captcha' })
		]));
		this.captchaStop.checked = global.storage.get('stopOnCaptcha') ?? DEFAULT_STOP_ON_CAPTCHA;

		this.left.appendChild(mk('input', {
			style: 'background-color: black; border-color: darkRed; color: red;',
			attributes: {
				type: 'file',
				style: 'width:100%;'
			},
			listeners: {
				change: e => {
					const reader = new FileReader();
					const { files } = <HTMLInputElement>e.composedPath()[0];
					if(files && files.length) {
						reader.readAsDataURL(files[0]);
						reader.onerror = console.error;
						reader.onload = () => bus.emit(APP_EVENTS.CHANGE_TEMPLATE_SRC, <string>reader.result);
					}
				}
			}
		}));

		this.left.appendChild(mk('button', {
			text: 'heatmap',
			breakText: true,
			listeners: {
				click: () => bus.emit(APP_EVENTS.SHOW_HEATMAP)
			}
		}));

		this.left.appendChild(mk('button', {
			breakText: true,
			text: 'on/off',
			listeners: {
				click: () => bus.emit(APP_EVENTS.SWITCH_BOT)
			}
		}));

		document.body.appendChild(this.root);
		document.head.appendChild(mk('style', { html: style }));

		let yPos = global.storage.get('window.x');
		if(yPos) {
			this.root.style.left = yPos.toString() + 'px';
		} else {
			this.root.style.left = (
				unsafeWindow.innerWidth - this.root.offsetWidth - DEFAULT_WIN_POS[0]).toString() + 'px';
		}

		// this must execute after adding root to the DOM
		// (because function check and fix coords if out of screen)
		makeDraggable(this.title, this.root, (x, y) => {
			global.storage.set('window.x', x);
			global.storage.set('window.y', y);
		});
	}

	public setBotOnline(online: number | null) {
		this.botOnline.innerText = online === null ? '?' : online.toString();
	}


	public setBotStatus(status: string | Error) {
		this.botStatusElement.innerText = confuseString(
			typeof status === 'string' ? 
			status : status.message);
	}

	public setCooldown(cooldown: number | null) {
		if(cooldown === null) {
			this.timerElement.innerText = '?';
		} else {
			this.timerElement.innerText = cooldown.toFixed(2).toString();
		}
	}

	public setBuildPredict(from: number | null, to?: number): void;
	public setBuildPredict(from: number, to?: number) {
		if(from === null) {
			this.buildPredict.innerText = '?';
		} else {
			const times = [from];
			if(to !== undefined && from !== to) {
				times.push(to);
			}

			if(times[0] > 2 * 3600) {
				this.buildPredict.innerText = times.map(s => s / 3600)
					.map(n => n.toFixed(1)).join('-') + 'h';
			} else if(times[0] > 2 * 60) {
				this.buildPredict.innerText = times.map(s => s / 60)
					.map(n => n.toFixed(1)).join('-') + 'm';
			} else {
				this.buildPredict.innerText = times.map(n => n.toFixed(1)).join('-') + 's';
			}
		}
	}

	public setProgress(errors: number | null, all?: number) {
		if(errors === null) {
			if(all === undefined) {
				this.errorsAmount.innerText = '?';
				this.progress.innerText = '?';
			} else {
				this.errorsAmount.innerText = '?';
				this.progress.innerText = `?/${this.formatIntNumbers(all)[0]}`;
			}
		} else {
			if(all === undefined) {
				this.errorsAmount.innerText = this.formatIntNumbers(errors)[0];
				this.progress.innerText = '?';
			} else {
				const right = all - errors;
				const percent = (right / all * 100).toFixed(2);
				this.errorsAmount.innerText = this.formatIntNumbers(errors)[0];
				this.progress.innerText = this.formatIntNumbers(right, all).join('/') + ` (${percent}%)`;
			}
		}
	}

	private formatIntNumbers(...nums: Array<number>) {
		const denominator = nums.some(n => n > 1e3) ? 1e3 : 0;
		return nums.map(n => {
			n = Math.floor(n);
			if(denominator === 0) {
				return n.toString();
			} else {
				return (n / denominator).toFixed(1) + 'k';
			}
		});
	}

	public setLastPlaced(x: number, y: number, clr: Vec3 | number) {
		this.placedPixel.innerText = `${x} ${y} `;
		if(typeof clr === 'number'){
			this.placedPixelColor.style.background = 'transparent';
			this.placedPixelColor.innerText = clr.toString();
		} else {
			this.placedPixelColor.style.background = `rgb(${clr})`;
		}
	}

	public addStrategy = (strategy: string) => {
		const hashed = hash(strategy).toString();
		hash2value.set(hashed, strategy);

		this.strategyElement.appendChild(mk('option', {
			breakText: true,
			text: strategy,
			attributes: {
				value: hashed
			}
		}));
	}

	public changeStrategy(strategy: string) {
		const hashed = hash(strategy).toString();
		hash2value.set(hashed, strategy);
		const targetedOption = Array.from(this.strategyElement.querySelectorAll('option'))
			.find(n => n.value === hashed);
		
		if(!targetedOption) {
			return false;
		} else {
			targetedOption.setAttribute('selected', '');
			return true;
		}
	}

	public setTemplatePosition(x: number, y: number) { 
		this.xInput.value = x.toString();
		this.yInput.value = y.toString();
	}
}