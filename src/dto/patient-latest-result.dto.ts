import { ApiProperty } from '@nestjs/swagger'

export class PatientLatestResult {
	@ApiProperty()
	dateTime: Date

	@ApiProperty()
	unit: string
}
