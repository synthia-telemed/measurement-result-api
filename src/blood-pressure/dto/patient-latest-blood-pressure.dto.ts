import { ApiProperty } from '@nestjs/swagger'
import { PatientLatestResult } from 'src/dto/patient-latest-result.dto'

export class PatientLatestBloodPressure extends PatientLatestResult {
	@ApiProperty()
	systolic: number

	@ApiProperty()
	diastolic: number
}
