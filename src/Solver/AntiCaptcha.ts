import { Captcha } from '../CanvasAPI/types'
import { svgToBase64 } from './funcs'
import { sleep } from '../functions'
import { Solver } from './types'

type AntiCaptchaCreateTaskPacket = {
	ErrorId: number
	ErrorCode: number
	TaskId: number
	ErrorDescription: string
}

type AntiCaptchaTaskResultPacket = {
	ErrorId: number
	ErrorCode: number
	ErrorDescription: string
	Status: string
	Solution: {
		Text: string
	}
}

export default class implements Solver {
	constructor(
		private token: string
	){}

	public async solve (captcha: Captcha) {
		// PPF captcha
		if('svg' in captcha) {
			const width = 384;
			const height = 230;
			const svg = (captcha.svg.replace('100%', width.toString())).replace('100%', height.toString());

			const b64 = svgToBase64(svg/*, width, height*/);
			const createTaskResponse = await this.createTask(b64);

			if (createTaskResponse.ErrorId > 0) {
				throw new Error([
					'Create task error',
					'Error code: ' + createTaskResponse.ErrorCode,
					'Error description: ' + createTaskResponse.ErrorDescription].join('\n'));
			}

			sleep(5e3);

			while(true) {
				const taskResultResponse = await this.getTaskResult(createTaskResponse.TaskId);

				if (taskResultResponse.ErrorId > 0) {
					throw new Error([
						'Task result error',
						'error code: ' + taskResultResponse.ErrorCode,
						'Error desc: ' + taskResultResponse.ErrorDescription].join('\n'));
				}

				if (taskResultResponse.Status == "ready") {
					return {
						id: captcha.id,
						solution: taskResultResponse.Solution.Text
					}
				} else {
					sleep(3e3);
				}
			}
		} else {
			throw new Error('undefined captcha type');
		}
	}

	private createTask(base64: string): Promise<AntiCaptchaCreateTaskPacket> {
		return fetch("https://api.anti-captcha.com/createTask", {
			method: 'POST',
			body: JSON.stringify({
				"clientKey": this.token,
				"task": {
					"type": "ImageToTextTask",
					"body": base64,
					"phrase": false,
					"case": false,
					"numeric": 0,
					"math": false,
					"minLength": 4,
					"maxLength": 4
					}}),
		}).then(res => res.json());
	}

	private getTaskResult(task_id: number): Promise<AntiCaptchaTaskResultPacket> {
		return fetch("https://api.anti-captcha.com/getTaskResult", {
			method: 'POST',
			body: JSON.stringify({
				"clientKey": this.token,
				"taskId": task_id
			}),

		}).then(res => res.json())
	}

}