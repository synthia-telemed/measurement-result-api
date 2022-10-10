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
import { BloodPressureService, BloodPressureVisualizationData } from './blood-pressure.service'
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
	@ApiOperation({ summary: 'Record blood pressure' })
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
	@ApiOperation({ summary: 'Get paient blood pressure visualization' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiOkResponse({ type: BloodPressureVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getBloodPressurePatientVisualization(
		@User() { id }: UserInfo,
		@Body() { date, granularity }: PatientBloodPressureVisualizationRequestDto
	): Promise<BloodPressureVisualizationResponseDto> {
		let isNumerical = false
		let data: BloodPressureVisualizationData[]
		if (granularity === Granularity.DAY) {
			isNumerical = true
			data = await this.bloodPressureService.getWithinTheDay(id, date)
		} else {
			data = await this.bloodPressureService.getAverageWithCategoricalLabel(id, date, granularity)
		}
		return {
			xLabel: this.getXLabel(granularity),
			unit: 'mmHG',
			isNumerical,
			data,
		}
	}

	getXLabel(granularity: Granularity): string {
		switch (granularity) {
			case Granularity.DAY:
				return 'Time'
			case Granularity.WEEK:
				return 'Date'
			case Granularity.MONTH:
				return 'Week'
		}
	}
}
