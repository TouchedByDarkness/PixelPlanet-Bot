import { Captcha, CaptchaSolution } from '../CanvasAPI/types'

export interface Solver {
	solve(captcha: Captcha): Promise<CaptchaSolution>
}