import { ApiProperty } from '@nestjs/swagger'
import { IsDateString } from 'class-validator'

export class DoctorVisualizationRequestDto {
	@ApiProperty()
	@IsDateString()
	from: Date

	@ApiProperty()
	@IsDateString()
	to: Date
}
