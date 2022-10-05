import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
	@Get('/api/healthcheck')
	getHealthcheck() {
		return {
			success: true,
			timestamp: new Date(),
		}
	}
}
