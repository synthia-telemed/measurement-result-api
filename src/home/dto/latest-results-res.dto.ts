import { ApiProperty } from '@nestjs/swagger'
import { PatientLatestBloodPressure } from 'src/blood-pressure/dto/patient-latest-blood-pressure.dto'
import { PatientLatestPulse } from 'src/blood-pressure/dto/patient-latest-pulse.dto'
import { PatientLatestGlucoseAllPeriod } from 'src/glucose/dto/patient-latest-glucose.dto'

export class LatestResultResponseDto {
	@ApiProperty()
	bloodPressure: PatientLatestBloodPressure

	@ApiProperty()
	pulse: PatientLatestPulse

	@ApiProperty()
	glucose: PatientLatestGlucoseAllPeriod
}
