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
		let data: BloodPressureVisualizationData[]
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)
		if (granularity === Granularity.DAY) {
			data = await this.bloodPressureService.getDayResults(id, sinceDateUTC, toDateUTC)
			// const day = dayjs(date).tz(this.TZ)
			// if (data.length > 0 && dayjs.unix(data[0].label).tz(this.TZ).hour() < 6) {
			// 	domain = [day.set('hour', 2).utc().unix(), day.set('hour', 22).utc().unix()]
			// } else {
			// 	domain = [day.set('hour', 6).utc().unix(), day.set('hour', 21).utc().unix()]
			// }
		} else {
			data = await this.bloodPressureService.getDayAverage(id, sinceDateUTC, toDateUTC)
		}
		const summary = await this.bloodPressureService.getAverage(id, sinceDateUTC, toDateUTC)
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
		const domain = [since.utc().unix(), to.utc().unix()]
		let ticks: number[] = []
		switch (granularity) {
			case Granularity.WEEK:
				for (let d = since.clone(); !d.isAfter(to); d = d.add(1, 'day')) {
					ticks.push(d.startOf('day').utc().unix())
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
		}
		return { domain, ticks }
	}
}
