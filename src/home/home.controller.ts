import { Controller, Get } from '@nestjs/common'
import {
	ApiOperation,
	ApiTags,
	ApiBearerAuth,
	ApiOkResponse,
	ApiUnauthorizedResponse,
	ApiInternalServerErrorResponse,
} from '@nestjs/swagger'
import { BloodPressureService } from 'src/blood-pressure/blood-pressure.service'
import { PulseService } from 'src/blood-pressure/pulse.service'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { GlucoseService } from 'src/glucose/glucose.service'
import { LatestResultResponseDto } from './dto/latest-results-res.dto'

@Controller('home')
@ApiTags('Home')
export class HomeController {
	constructor(
		private readonly bloodPressureService: BloodPressureService,
		private readonly pulseService: PulseService,
		private readonly glucoseService: GlucoseService
	) {}

	@Get('latest')
	@Roles(UserRole.PATIENT)
	@ApiOperation({ summary: 'Get paient today latest result' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiOkResponse({ type: LatestResultResponseDto })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async getLatestResults(@User() { id }: UserInfo) {
		const [bloodPressure, pulse, glucose] = await Promise.all([
			this.bloodPressureService.getTodayLatestResult(id),
			this.pulseService.getTodayLatestResult(id),
			this.glucoseService.getTodayLatestResultAllPeriod(id),
		])
		return {
			bloodPressure,
			pulse,
			glucose,
		}
	}
}
