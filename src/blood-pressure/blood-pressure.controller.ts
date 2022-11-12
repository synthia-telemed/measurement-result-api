import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
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
import { PatientVisualizationRequestDto } from '../dto/patient-visualization-request.dto'
import { BloodPressureVisualizationResponseDto } from './dto/patient-visualization-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BaseController } from 'src/base/base.controller'
import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone'
import { DoctorAppointmentGuard } from 'src/guard/appointment.guard'
dayjs.extend(timezone)

@Controller('blood-pressure')
@ApiTags('Blood Pressure')
export class BloodPressureController extends BaseController {
	constructor(private readonly bloodPressureService: BloodPressureService) {
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

	@Get('/visualization/doctor/:appointmentID')
	@Roles(UserRole.DOCTOR)
	@UseGuards(DoctorAppointmentGuard)
	async getDoctorBloodPressurePatientVisualization(@User() { id }: UserInfo): Promise<any> {
		// await this.bloodPressureService.getPatientIDFromAppointment(id, appointmentID)
		return { success: true }
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
		@Query() { date, granularity }: PatientVisualizationRequestDto
	): Promise<BloodPressureVisualizationResponseDto> {
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)

		const [summary, data] = await Promise.all([
			this.bloodPressureService.getAverage(id, sinceDateUTC, toDateUTC),
			this.bloodPressureService.getVisualizationData(id, granularity, sinceDateUTC, toDateUTC),
		])
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, data.length > 0 ? data[0] : null)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: this.bloodPressureService.unit,
			data,
			summary,
			ticks,
			domain,
		}
	}
}
