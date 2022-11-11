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
import { BaseController } from 'src/base/base.controller'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { PatientVisualizationRequestDto } from 'src/dto/patient-visualization-request.dto'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import { GlucoseVisualizationResponseDto } from './dto/visualization-glucose.dto'
import { GlucoseService } from './glucose.service'
import { Glucose } from './schema/glucose.schema'

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
	async getBloodPressurePatientVisualization(
		@User() { id }: UserInfo,
		@Query() { date, granularity }: PatientVisualizationRequestDto
	): Promise<GlucoseVisualizationResponseDto> {
		const { sinceDate: sinceDateUTC, toDate: toDateUTC } = this.getSinceAndToUTCDate(granularity, date)

		const data = await this.glucoseService.getVisualizationDatas(id, granularity, sinceDateUTC, toDateUTC)
		const { domain, ticks } = this.getDomainAndTicks(granularity, date, null)
		return {
			xLabel: this.getXLabel(granularity, date),
			unit: 'mg/dL',
			data,
			ticks,
			domain,
		}
	}
}
