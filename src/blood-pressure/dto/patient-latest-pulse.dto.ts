import { ApiProperty } from '@nestjs/swagger'
import { Status } from 'src/base/model'
import { PatientLatestResult } from 'src/dto/patient-latest-result.dto'

export class PatientLatestPulse extends PatientLatestResult {
	@ApiProperty()
	value: number

	@ApiProperty({ enum: Status })
	status: Status
}
