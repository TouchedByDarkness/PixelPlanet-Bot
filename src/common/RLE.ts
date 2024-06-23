const rle_flag = 1 << 7;

export const RLEPack = (data: Uint8Array): Uint8Array => {
	const packed: Array<number> = [];
	const dataSize = data.length;

	let i = 0;
	while(true) {
		const mainCurrent = data[i];

		// current el is last
		if(i === dataSize - 1) {
			packed.push(1, mainCurrent);
			break;
		}

		let counter = 0;
		if(mainCurrent === data[i + 1]) {
			counter++;
			i++;
			// same
			while(i !== dataSize && mainCurrent === data[i]) {
				counter++;
				i++;

				if(counter === 127) {
					break;
				}
			}

			packed.push(counter, mainCurrent);
			
			if(i === dataSize) {
				break;
			}
		} else {
			// not same
			const counterIndex = packed.length;
			// space for counter
			packed.push(0);
			while (i !== dataSize - 1 && data[i] !== data[i + 1]) {
				packed.push(data[i]);
				counter++;
				i++;
				if (counter === 127) {
					break;
				}
			}
			packed[counterIndex] = counter | rle_flag;
		}
	}

	return new Uint8Array(packed);
}

export const RLEUnpack = (data: Uint8Array): Uint8Array => {
	const unpacked: Array<number> = [];
	const dataSize = data.length;

	let i = 0;
	while(i !== dataSize) {
		if ((data[i] & rle_flag) === 0) {
			// same
			const repeat = data[i];
			i++;
			const elToRepeat = data[i];
			i++;
			for (let j = 0; j !== repeat; j++) {
				unpacked.push(elToRepeat);
			}
		} else {
			// not same
			// const noRepeat = data[i] & ^rle_flag;
			const noRepeat = data[i];
			i++;
			for (let j = 0; j !== noRepeat; j++) {
				unpacked.push(data[i]);
				i++;
			}
		}
	}

	return new Uint8Array(unpacked);
}