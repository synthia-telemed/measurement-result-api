import { Controller, Post } from '@nestjs/common'
import { BloodPressureService } from './blood-pressure.service'

@Controller('blood-pressure')
export class BloodPressureController {
	constructor(private readonly bloodPressureService: BloodPressureService) {}
	@Post()
	async createBloodPressure() {
		return this.bloodPressureService.create()
	}
}
