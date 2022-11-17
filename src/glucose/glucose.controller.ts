import { Body, Controller, Get, Post, Query, UseGuards, Request } from '@nestjs/common'
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
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { LeanDocument } from 'mongoose'
import { BaseController } from 'src/base/base.controller'
import { PatientGranularity } from 'src/base/model'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { DoctorVisualizationRequestDto } from 'src/dto/doctor-visualization-request.dto'
import { PatientVisualizationRequestDto } from 'src/dto/patient-visualization-request.dto'
import { DoctorAppointmentGuard } from 'src/guard/appointment.guard'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import {
	DoctorGlucoseStatus,
	DoctorGlucoseSummary,
	DoctorGlucoseVisualizationResponseDto,
} from './dto/doctor-visualization.dto'
import {
	GlucoseSummary,
	GlucoseVisualizationDatas,
	GlucoseVisualizationDataWithPeriod,
	GlucoseVisualizationResponseDto,
} from './dto/visualization-glucose.dto'
import { GlucoseService } from './glucose.service'
import { Glucose, Period } from './schema/glucose.schema'
dayjs.extend(utc)

@Controller('glucose')
@ApiTags('Glucose')
export class GlucoseController extends BaseController {
	constructor(private glucoseService: GlucoseService) {
		super()
	}

	@Post()
	@Roles(UserRole.PATIENT)
	@ApiOperation({ summary: 'Record glucose' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiCreatedResponse({ type: Glucose })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async createGlucose(@User() { id }: UserInfo, @Body() data: CreateGlucoseDto): Promise<Glucose> {
		return this.glucoseService.create(data, id)
	}

	@Get('/visualization/patient')
	@Roles(UserRole.PATIENT)
	@ApiOperation({ summary: 'Get paient glucose visualization' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiOkResponse({ type: GlucoseVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getPatientGlucoseVisualization(
		@User() { id }: UserInfo,
		@Query() { date, granularity }: PatientVisualizationRequestDto
	): Promise<GlucoseVisualizationResponseDto> {
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)

		let data: GlucoseVisualizationDatas | GlucoseVisualizationDataWithPeriod[]
		let summary: GlucoseSummary
		if (granularity === PatientGranularity.DAY) {
			const [visData, lastestResult] = await Promise.all([
				this.glucoseService.getDayVisualizationData(id, sinceDateUTC, toDateUTC),
				this.glucoseService.getLastestResult(id, sinceDateUTC, toDateUTC),
			])
			data = visData
			if (lastestResult) {
				summary = {
					value: lastestResult.value,
					status: this.glucoseService.getStatus(lastestResult.metadata.period, lastestResult.value),
				}
			}
		} else {
			const [visData, avgResults] = await Promise.all([
				this.glucoseService.getAggregatedVisualizationDatas(id, sinceDateUTC, toDateUTC),
				this.glucoseService.getAverage(id, sinceDateUTC, toDateUTC),
			])
			data = visData
			summary = avgResults.length > 0 ? { status: this.glucoseService.getStatusFromAverage(avgResults) } : null
		}
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, null)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: this.glucoseService.unit,
			data,
			ticks,
			domain,
			summary,
		}
	}

	@Get('/visualization/doctor/:appointmentID')
	@Roles(UserRole.DOCTOR)
	@UseGuards(DoctorAppointmentGuard)
	@ApiOperation({ summary: 'Get doctor glucose visualization' })
	@ApiTags('Doctor')
	@ApiBearerAuth()
	@ApiParam({ name: 'appointmentID', type: 'string' })
	@ApiOkResponse({ type: DoctorGlucoseVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getDoctorGlucoseVisualization(
		@Request() { patientID },
		@Query() { from: fromDate, to: toDate }: DoctorVisualizationRequestDto
	): Promise<DoctorGlucoseVisualizationResponseDto> {
		const from = this.parseUTCDateToDayjs(fromDate).startOf('day')
		const to = this.parseUTCDateToDayjs(toDate).endOf('day')
		const [data, abnormalResults] = await Promise.all([
			this.glucoseService.getAggregatedVisualizationDatas(patientID, from.utc().toDate(), to.utc().toDate()),
			this.glucoseService.getAbnormalGlucoseResult(patientID, from.utc().toDate(), to.utc().toDate()),
		])
		const summary = this.parseAbnormalResultsToDoctorSummary(abnormalResults)
		const { domain, ticks } = this.getDoctorDomainAndTicks(from, to)
		return {
			data,
			domain,
			ticks,
			unit: this.glucoseService.unit,
			xLabel: this.getDoctorXLabel(from, to),
			summary,
		}
	}

	private parseAbnormalResultsToDoctorSummary(results: LeanDocument<Glucose>[]): DoctorGlucoseSummary {
		const summary: DoctorGlucoseSummary = {
			fasting: { hyperglycemia: [], hypoglycemia: [], normal: [], warning: [] },
			afterMeal: { hyperglycemia: [], hypoglycemia: [], normal: [] },
			beforeMeal: { hyperglycemia: [], hypoglycemia: [], normal: [] },
		}
		for (const result of results) {
			const { value, metadata, dateTime } = result
			const status = this.glucoseService.getDoctorGlucoseStatus(metadata.period, value)
			const periodKey = this.parsePeriodToDoctorSummaryKey(metadata.period)
			const statusKey = this.parseDoctorStatusToStatusKey(status)
			summary[periodKey][statusKey].push({ value, dateTime })
		}
		return summary
	}

	private parsePeriodToDoctorSummaryKey(period: Period): string {
		switch (period) {
			case Period.BeforeMeal:
				return 'beforeMeal'
			case Period.AfterMeal:
				return 'afterMeal'
			default:
				return 'fasting'
		}
	}

	private parseDoctorStatusToStatusKey(status: DoctorGlucoseStatus): string {
		switch (status) {
			case DoctorGlucoseStatus.HYPERGLYCEMIA:
				return 'hyperglycemia'
			case DoctorGlucoseStatus.HYPOGLYCEMIA:
				return 'hypoglycemia'
			case DoctorGlucoseStatus.Warning:
				return 'warning'
			default:
				return 'normal'
		}
	}
}
