import { Body, Controller, Get, Post, Query } from '@nestjs/common'
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
import { HospitalService } from 'src/hospital/hospital.service'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { Granularity, PatientBloodPressureVisualizationRequestDto } from './dto/patient-visualization-request.dto'
import {
	BloodPressureVisualizationData,
	BloodPressureVisualizationResponseDto,
} from './dto/patient-visualization-blood-pressure-res.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BaseController } from 'src/base/base.controller'

@Controller('blood-pressure')
@ApiTags('Blood Pressure')
export class BloodPressureController extends BaseController {
	constructor(
		private readonly bloodPressureService: BloodPressureService,
		private readonly hospitalService: HospitalService
	) {
		super()
	}

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

	// @Get('/visualization/doctor/:appointmentID')
	// @Roles(UserRole.DOCTOR)
	// async getDoctorBloodPressurePatientVisualization(@User() { id }: UserInfo) {}

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
		@Query() { date, granularity }: PatientBloodPressureVisualizationRequestDto
	): Promise<BloodPressureVisualizationResponseDto> {
		let data: BloodPressureVisualizationData[]
		const { sinceDate, toDate } = this.getSinceAndToUTCDate(granularity, date)
		if (granularity === Granularity.DAY) {
			data = await this.bloodPressureService.getWithinTheDay(id, sinceDate, toDate)
		} else {
			data = await this.bloodPressureService.getAverageWithCategoricalLabel(id, sinceDate, toDate)
		}
		const summary = await this.bloodPressureService.getAverage(id, sinceDate, toDate)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: 'mmHG',
			data,
			summary,
			ticks: [],
		}
	}
}
