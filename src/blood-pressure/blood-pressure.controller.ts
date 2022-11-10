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
import { PatientBloodPressureVisualizationRequestDto } from './dto/patient-visualization-request.dto'
import {
	BloodPressureVisualizationData,
	BloodPressureVisualizationResponseDto,
} from './dto/patient-visualization-blood-pressure-res.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BaseController } from 'src/base/base.controller'
import { Granularity } from 'src/base/model'
import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone'
dayjs.extend(timezone)

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
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)

		let dataOp: Promise<BloodPressureVisualizationData[]>
		if (granularity === Granularity.DAY) {
			dataOp = this.bloodPressureService.getDayResults(id, sinceDateUTC, toDateUTC)
		} else {
			dataOp = this.bloodPressureService.getDayAverage(id, sinceDateUTC, toDateUTC)
		}
		const [summary, data] = await Promise.all([
			this.bloodPressureService.getAverage(id, sinceDateUTC, toDateUTC),
			dataOp,
		])
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, data[0])
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: 'mmHG',
			data,
			summary,
			ticks,
			domain,
		}
	}

	getDomainAndTicks(
		granularity: Granularity,
		date: Date,
		firstData: BloodPressureVisualizationData
	): { domain: number[]; ticks: number[] } {
		const { sinceDate: since, toDate: to } = this.getSinceAndToDayjs(granularity, date)
		let domain = [since.utc().unix(), to.utc().unix()]
		let ticks: number[] = []
		switch (granularity) {
			case Granularity.WEEK:
				ticks = Array.from<number>({ length: 7 }).fill(0)
				for (let d = since.clone(), i = 0; !d.isAfter(to); d = d.add(1, 'day'), i++) {
					ticks[i] = d.startOf('day').utc().unix()
				}
				break

			case Granularity.MONTH:
				const firstTickDate = since.add(3, 'day').startOf('day')
				const lastTickDate = to.subtract(3, 'day').startOf('day')
				ticks = Array.from<number>({ length: 4 }).fill(0)
				ticks[0] = firstTickDate.utc().unix()
				ticks[3] = lastTickDate.utc().unix()
				const diff = lastTickDate.diff(firstTickDate, 'day')
				const tickInterval = diff / 3
				ticks[1] = firstTickDate.add(tickInterval, 'day').utc().unix()
				ticks[2] = lastTickDate.subtract(tickInterval, 'day').utc().unix()
				break

			case Granularity.DAY:
				ticks = Array.from<number>({ length: 6 }).fill(0)
				const firstResultBefore6AM = firstData.label < since.set('hour', 6).utc().unix()
				const interval = firstResultBefore6AM ? 4 : 3
				for (
					let d = since.clone().set('hour', firstResultBefore6AM ? 2 : 6), i = 0;
					!d.isAfter(to);
					d = d.add(interval, 'hour'), i++
				) {
					ticks[i] = d.utc().unix()
				}
				domain = [ticks[0], ticks[5]]
		}
		return { domain, ticks }
	}
}
