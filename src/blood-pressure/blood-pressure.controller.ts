import { Body, Controller, Post } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'

@Controller('blood-pressure')
@ApiTags('Blood Pressure')
export class BloodPressureController {
	constructor(private readonly bloodPressureService: BloodPressureService) {}

	@Post()
	@Roles(UserRole.PATIENT)
	@ApiOperation({ description: 'Record blood pressure' })
	@ApiTags('Patient')
	@ApiBearerAuth('JWSToken')
	@ApiCreatedResponse({ type: BloodPressure })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async createBloodPressure(@User() { id }: UserInfo, @Body() data: CreateBloodPressureDto): Promise<BloodPressure> {
		return this.bloodPressureService.create(data, id)
	}
}
