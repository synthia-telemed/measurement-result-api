import { ApiProperty } from '@nestjs/swagger'
import { Status } from 'src/base/model'
import { PatientLatestResult } from 'src/dto/patient-latest-result.dto'

export class PatientLatestBloodPressure extends PatientLatestResult {
	@ApiProperty()
	systolic: number

	@ApiProperty()
	diastolic: number

	@ApiProperty({ enum: Status })
	status: Status
}
