import { Body, Controller, Post } from '@nestjs/common'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'

@Controller('blood-pressure')
export class BloodPressureController {
	constructor(private readonly bloodPressureService: BloodPressureService) {}
	@Post()
	async createBloodPressure(@Body() data: CreateBloodPressureDto) {
		return this.bloodPressureService.create(data, 10)
	}
}
