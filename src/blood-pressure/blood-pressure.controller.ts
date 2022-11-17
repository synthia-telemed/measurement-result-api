import { Body, Controller, Get, Post, Query, Request, UseGuards } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { BloodPressureService } from './blood-pressure.service'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { PatientVisualizationRequestDto } from '../dto/patient-visualization-request.dto'
import { BloodPressureVisualizationResponseDto } from './dto/patient-visualization-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BaseController } from 'src/base/base.controller'
import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone'
import { DoctorAppointmentGuard } from 'src/guard/appointment.guard'
import { DoctorVisualizationRequestDto } from 'src/dto/doctor-visualization-request.dto'
import { Status } from 'src/base/model'
import { LeanDocument } from 'mongoose'
import {
	BloodPressureAbnormalResult,
	BloodPressureAbnormalResultSummary,
	DoctorBloodPressureVisualizationResponseDto,
} from './dto/doctor-visualization-blood-pressure.dto'
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
	@ApiOperation({ summary: 'Get doctor blood pressure visualization' })
	@ApiTags('Doctor')
	@ApiBearerAuth()
	@ApiParam({ name: 'appointmentID', type: 'string' })
	@ApiOkResponse({ type: DoctorBloodPressureVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getDoctorBloodPressurePatientVisualization(
		@Request() { patientID },
		@Query() { from: fromDate, to: toDate }: DoctorVisualizationRequestDto
	): Promise<DoctorBloodPressureVisualizationResponseDto> {
		const from = this.parseUTCDateToDayjs(fromDate).startOf('day')
		const to = this.parseUTCDateToDayjs(toDate).endOf('day')
		const fromDateUTC = from.utc().toDate()
		const toDateUTC = to.utc().toDate()
		const [summary, data, abnormalResults] = await Promise.all([
			this.bloodPressureService.getAverage(patientID, fromDateUTC, toDateUTC),
			this.bloodPressureService.getVisualizationData(patientID, fromDateUTC, toDateUTC, true),
			this.bloodPressureService.getAbnormalResults(patientID, fromDate, toDateUTC),
		])
		const { domain, ticks } = this.getDoctorDomainAndTicks(from, to)
		return {
			summary,
			data,
			domain,
			ticks,
			xLabel: this.getDoctorXLabel(from, to),
			unit: this.bloodPressureService.unit,
			abnormalResults: this.parseAbnormalResultsToAbnormalResultSummary(abnormalResults),
		}
	}

	private parseAbnormalResultsToAbnormalResultSummary(
		results: LeanDocument<BloodPressure>[]
	): BloodPressureAbnormalResultSummary {
		const summary: BloodPressureAbnormalResultSummary = {
			abnormal: [],
			warning: [],
		}
		for (const { dateTime, systolic, diastolic } of results) {
			const status = this.bloodPressureService.getStatusFromBloodPressure(systolic, diastolic)
			const abnormalResultKey = this.parseStatusToAbnormalResultKey(status)
			const abnormalResult: BloodPressureAbnormalResult = { dateTime, systolic, diastolic }
			summary[abnormalResultKey].push(abnormalResult)
		}
		return summary
	}

	private parseStatusToAbnormalResultKey(status: Status): string {
		switch (status) {
			case Status.ABNORMAL:
				return 'abnormal'
			case Status.WARNING:
				return 'warning'
			default:
				return 'normal'
		}
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
			this.bloodPressureService.getVisualizationData(id, sinceDateUTC, toDateUTC, this.isAggregate(granularity)),
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
