import { Target, SortingFunc } from './types'
import Template from '../Template'
import {
	sq,
	swap,
	shuffle,
	sortDescending,
	sortAscending,
	squareInt
} from '../functions'

export default <Record<string, SortingFunc>>{
	random: (tmp: Template) => shuffle(createTargets(tmp)),
	line_upToDown: createTargets,
	line_downToUp: (tmp: Template) => {
		const targets = createTargets(tmp);
		for (let i = 0; i !== targets.length >> 1; i++) {
			const j = targets.length - i - 1;
			swap(targets, i, j);
		}
		return targets;
	},
	line_leftToRight: (tmp: Template) => {
		return sortDescending(createTargets(tmp), t => t[0]);
	},
	line_RightToLeft: (tmp: Template) => {
		return sortAscending(createTargets(tmp), t => t[0]);
	},
	circle_inToOut: (tmp: Template) => {
		const [centerX, centerY] = tmp.localCenter;
		return sortAscending(createTargets(tmp), t => squareInt(t[0] - centerX) + squareInt(t[1] - centerY));
	},
	circle_outToIn: (tmp: Template) => {
		const [centerX, centerY] = tmp.localCenter;
		return sortDescending(createTargets(tmp), (t: Target) => squareInt(t[0] - centerX) + squareInt(t[1] - centerY));
	},
	throughLine: (tmp: Template) => {
		const offset = tmp.size;
		return sortDescending(createTargets(tmp), t => {
			if ((t[1] & 1) === 0) {
				return t[0] + t[1] - offset;
			} else {
				return t[0] + t[1];
			}
		});
	},
	chess_1x1: (tmp: Template) => {
		const offset = tmp.size;
		return sortDescending(createTargets(tmp), (t: Target): number => {
			if ((t[0] & 1) !== (t[1] & 1)) {
				return t[1] + offset;
			} else {
				return t[1];
			}
		});
	},
	chess_2x2: (tmp: Template) => {
		const offset = tmp.size;
		return sortDescending(createTargets(tmp), (t: Target): number => {
			if ((t[0] & 3 ^ t[1] & 3) <= 1) {
				return t[1] - offset;
			} else {
				return t[1];
			}
		});
	},
	chess_3x3: (tmp: Template) => {
		const offset = tmp.size;
		return sortDescending(createTargets(tmp), (t: Target): number => {
			if ((t[0] & 7 ^ t[1] & 7) <= 3) {
				return t[1] - offset;
			} else {
				return t[1];
			}
		});
	},
	chessCorner_1x1: (tmp: Template) => {
		const offset = tmp.size;
		return sortDescending(createTargets(tmp), (t: Target): number => {
			if ((t[0] & 1) !== (t[1] & 1)) {
				return t[0] + t[1] + offset
			} else {
				return t[0] + t[1]
			}
		});
	},
	woyken: (tmp: Template) => {
		const size = tmp.size;
		const gridSize = 8;
		const [centerX, centerY] = tmp.localCenter;
		return sortDescending(createTargets(tmp), (t: Target): number => {
			const x = t[0]
			const y = t[1]
			if (x !== 0 && y !== 0 && x !== tmp.width - 1 && y !== tmp.height - 1) {
				if (tmp.isOutline(x, y)) {
					return -size + y
				}
			}

			if ((x + y) % gridSize === 0 || Math.abs(x - y) % gridSize === 0) {
				return y
			}

			const sqDist = squareInt(x - centerX) + squareInt(y - centerY)
			return size - Math.floor(Math.sqrt(sqDist));
		});
	},
	colorByColor: (tmp: Template) => {
		let all = createTargets(tmp);
		const colors: Record<number, Array<Target>> = {};

		all.forEach(t => {
			const clr = tmp.get(t[0], t[1]);
			const group = colors[clr];
			if (!group) {
				colors[clr] = [t];
			} else {
				group.push(t);
			}
		});

		all = new Array(all.length);

		const size = tmp.size
		const center = [tmp.width / 2, tmp.height / 2];
		let i = 0
		Object.values(colors).forEach(colorGroup => {
			sortDescending(colorGroup, (t: Target): number => {
				const sqDist = squareInt(t[0] - center[0]) + squareInt(t[1] - center[1]);
				return size - Math.floor(Math.sqrt(sqDist));
			});

			colorGroup.forEach(t => {
				all[i] = t;
				i++;
			});
		});

		return all;
	},
	squareBySquare: (tmp: Template) => {
		const all: Array<Target> = [];
		const blockSize = 8;
		for(let y = 0; y < tmp.height; y += blockSize) {
			for(let x = 0; x < tmp.width; x += blockSize) {
				for(let localY = y; localY !== y + blockSize; localY++) {
					if (localY >= tmp.height) {
						break
					}

					for (let localX = x; localX !== x + blockSize; localX++) {
						if (localX >= tmp.width || tmp.isTransparent(localX, localY)) {
							continue
						}

						all.push([localX, localY])
					}
				}
			}
		}

		return all;
	},
	zipper: (tmp: Template) => {
		return sortDescending(createTargets(tmp), t => Math.floor(Math.sqrt(t[0] + t[1])));
	},
	zipper2: (tmp: Template) => {
		return sortDescending(createTargets(tmp), (t: Target): number => (
			Math.floor(Math.sqrt(t[0] + t[1] - 3 * tmp.get(t[0], t[1])))));
	},
	rhombLine: (tmp: Template) => {
		const [centerX, centerY] = tmp.localCenter;
		return createTargets(tmp).sort((a, b) => (
			Math.sin(Math.abs(a[0] - centerX) + Math.abs(a[1] - centerY)) -
			Math.sin(Math.abs(b[0] - centerX) + Math.abs(b[1] - centerY))));
	},
	rhombLine2: (tmp: Template) => {
		const [centerX, centerY] = tmp.localCenter;
		return createTargets(tmp).sort((a, b) => (
			Math.tan(Math.abs(a[0] - centerX) + Math.abs(a[1] - centerY)) -
			Math.tan(Math.abs(b[0] - centerX) + Math.abs(b[1] - centerY))));
	},
	alienRandom: (tmp: Template) => {
		return createTargets(tmp).sort((a, b) => Math.tan(sq(a[0] - b[1]) - sq(a[1] - b[0])));
	},
	alien1: (tmp: Template) => {
		return sortDescending(createTargets(tmp), t => Math.tan(sq(t[0]) + sq(t[1])));
	},
	alien2: (tmp: Template) => {
		return sortDescending(createTargets(tmp), t => Math.exp(Math.cos(t[0] * t[1])));
	},
	alien3: (tmp: Template) => {
		const xCache = new Map<number, number>();
		return sortDescending(createTargets(tmp), (t: Target): number => {
			let xCached = xCache.get(t[0]);
			if (xCached === undefined) {
				xCached = Math.pow(7, t[0] * Math.sin(t[0]))
				xCache.set(t[0], xCached);
			}

			return xCached - Math.pow(t[0], 7 * Math.sin(t[1]))
		});
	},
	alien4: (tmp: Template) => {
		const xCache = new Map<number, number>();
		const yCache = new Map<number, number>();
		return sortDescending(createTargets(tmp), (t: Target): number => {
			let xCached = xCache.get(t[0]);
			if(xCached === undefined) {
				xCached = Math.pow(Math.sin(t[0]), t[0]);
				xCache.set(t[0], xCached);
			}

			let yCached = yCache.get(t[1]);
			if(yCached === undefined) {
				yCached = Math.pow(Math.cos(t[1]), t[1]);
				yCache.set(t[1], yCached);
			}

			return xCached + yCached
		});
	}
}

function createTargets(tmp: Template) {
	const targets: Array<Target> = [];

	const w = tmp.width;
	const h = tmp.height;
	for(let y = 0; y !== h; y++)
		for(let x = 0; x !== w; x++)
			if(!tmp.isTransparent(x, y))
				targets.push([x, y]);

	return targets;
}