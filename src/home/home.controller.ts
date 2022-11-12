import { Controller, Get } from '@nestjs/common'
import { BloodPressureService } from 'src/blood-pressure/blood-pressure.service'
import { PulseService } from 'src/blood-pressure/pulse.service'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { GlucoseService } from 'src/glucose/glucose.service'

@Controller('home')
export class HomeController {
	constructor(
		private readonly bloodPressureService: BloodPressureService,
		private readonly pulseService: PulseService,
		private readonly glucoseService: GlucoseService
	) {}

	@Get('latest')
	@Roles(UserRole.PATIENT)
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
