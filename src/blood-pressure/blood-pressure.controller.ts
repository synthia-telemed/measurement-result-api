import { Body, Controller, Post } from '@nestjs/common'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'

@Controller('blood-pressure')
export class BloodPressureController {
	constructor(private readonly bloodPressureService: BloodPressureService) {}

	@Post()
	@Roles(UserRole.PATIENT)
	async createBloodPressure(@User() { id }: UserInfo, @Body() data: CreateBloodPressureDto) {
		return this.bloodPressureService.create(data, id)
	}
}
