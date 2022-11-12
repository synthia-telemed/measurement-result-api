import { Controller, Get, Query } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiInternalServerErrorResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { BaseController } from 'src/base/base.controller'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { PulseVisualizationResponseDto } from './dto/patient-visualization-pulse.dto'
import { PatientVisualizationRequestDto } from '../dto/patient-visualization-request.dto'
import { PulseService } from './pulse.service'

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
			this.pulseService.getVisualizationData(id, granularity, sinceDateUTC, toDateUTC),
		])
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, data.length > 0 ? data[0] : null)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: 'mg/dl',
			data,
			summary,
			ticks,
			domain,
		}
	}
}
