import { Body, Controller, Get, Post } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { Granularity, PatientBloodPressureVisualizationRequestDto } from './dto/patient-visualization-request.dto'
import { BloodPressureVisualizationResponseDto } from './dto/patient-visualization-response.dto'
import { BloodPressure } from './schema/blood-pressure.schema'

@Controller('blood-pressure')
@ApiTags('Blood Pressure')
export class BloodPressureController {
	constructor(private readonly bloodPressureService: BloodPressureService) {}

	@Post()
	@Roles(UserRole.PATIENT)
	@ApiOperation({ description: 'Record blood pressure' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiCreatedResponse({ type: BloodPressure })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async createBloodPressure(@User() { id }: UserInfo, @Body() data: CreateBloodPressureDto): Promise<BloodPressure> {
		return this.bloodPressureService.create(data, id)
	}

	@Get('/visualization/patient')
	@Roles(UserRole.PATIENT)
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiOkResponse({ type: BloodPressureVisualizationResponseDto })
	async getBloodPressurePatientVisualization(
		@User() { id }: UserInfo,
		@Body() { startDate, endDate, granularity }: PatientBloodPressureVisualizationRequestDto
	): Promise<BloodPressureVisualizationResponseDto> {
		if (granularity === Granularity.DAY) {
			return
		}
		const data = await this.bloodPressureService.getAverageWithCategoricalLabel(id, startDate, endDate, granularity)
		return {
			xLabel: Granularity.WEEK ? 'Date' : 'Week',
			unit: 'mmHG',
			isNumerical: false,
			data,
		}
	}
}
