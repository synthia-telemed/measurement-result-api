import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiForbiddenResponse,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiParam,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { BaseController } from 'src/base/base.controller'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { PulseVisualizationResponseDto } from './dto/patient-visualization-pulse.dto'
import { PatientVisualizationRequestDto } from '../dto/patient-visualization-request.dto'
import { PulseService } from './pulse.service'
import { DoctorAppointmentGuard } from 'src/guard/appointment.guard'
import { DoctorVisualizationRequestDto } from 'src/dto/doctor-visualization-request.dto'

@Controller('pulse')
@ApiTags('Pulse')
export class PulseController extends BaseController {
	constructor(private readonly pulseService: PulseService) {
		super()
	}

	@Get('/visualization/patient')
	@Roles(UserRole.PATIENT)
	@ApiOperation({ summary: 'Get paient pulse visualization' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiOkResponse({ type: PulseVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getPulsePatientVisualization(
		@User() { id }: UserInfo,
		@Query() { date, granularity }: PatientVisualizationRequestDto
	): Promise<PulseVisualizationResponseDto> {
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)

		const [summary, data] = await Promise.all([
			this.pulseService.getSummary(id, sinceDateUTC, toDateUTC),
			this.pulseService.getVisualizationData(id, sinceDateUTC, toDateUTC, this.isAggregate(granularity)),
		])
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, data.length > 0 ? data[0] : null)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: this.pulseService.unit,
			data,
			summary,
			ticks,
			domain,
		}
	}

	@Get('/visualization/doctor/:appointmentID')
	@Roles(UserRole.DOCTOR)
	@UseGuards(DoctorAppointmentGuard)
	@ApiOperation({ summary: 'Get doctor pulse visualization' })
	@ApiTags('Doctor')
	@ApiBearerAuth()
	@ApiParam({ name: 'appointmentID', type: 'string' })
	@ApiOkResponse({ type: PulseVisualizationResponseDto })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiForbiddenResponse({ description: 'Forbidden' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getDoctorPulseVisualization(
		@Request() { patientID },
		@Query() { from: fromDate, to: toDate }: DoctorVisualizationRequestDto
	): Promise<PulseVisualizationResponseDto> {
		const from = this.parseUTCDateToDayjs(fromDate).startOf('day')
		const to = this.parseUTCDateToDayjs(toDate).endOf('day')
		const fromDateUTC = from.utc().toDate()
		const toDateUTC = to.utc().toDate()
		const [summary, data] = await Promise.all([
			this.pulseService.getSummary(patientID, fromDateUTC, toDateUTC),
			this.pulseService.getVisualizationData(patientID, fromDateUTC, toDateUTC, true),
		])
		const { domain, ticks } = this.getDoctorDomainAndTicks(from, to)
		return {
			xLabel: this.getDoctorXLabel(from, to),
			unit: this.pulseService.unit,
			data,
			summary,
			ticks,
			domain,
		}
	}
}
