import { ApiProperty } from '@nestjs/swagger'
import { PatientLatestResult } from 'src/dto/patient-latest-result.dto'

export class PatientLatestPulse extends PatientLatestResult {
	@ApiProperty()
	value: number
}
