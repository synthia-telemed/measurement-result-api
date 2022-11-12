import { ApiProperty } from '@nestjs/swagger'
import { PatientLatestResult } from 'src/dto/patient-latest-result.dto'

export class PatientLatestGlucose extends PatientLatestResult {
	@ApiProperty()
	value: number
}

export class PatientLatestGlucoseAllPeriod {
	@ApiProperty({ nullable: true })
	fasting?: PatientLatestGlucose

	@ApiProperty({ nullable: true })
	beforeMeal?: PatientLatestGlucose

	@ApiProperty({ nullable: true })
	afterMeal?: PatientLatestGlucose
}
