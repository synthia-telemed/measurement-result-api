import { ApiProperty } from '@nestjs/swagger'
import { Status } from 'src/base/model'

export class PatientLatestResult {
	@ApiProperty()
	dateTime: Date

	@ApiProperty()
	unit: string

	@ApiProperty({ enum: Status })
	status: Status
}
