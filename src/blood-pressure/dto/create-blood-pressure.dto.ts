import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsNumber } from 'class-validator'

export class CreateBloodPressureDto {
	@ApiProperty()
	@IsDateString()
	dateTime: Date

	@ApiProperty()
	@IsNumber()
	systolic: number

	@ApiProperty()
	@IsNumber()
	diastolic: number

	@ApiProperty()
	@IsNumber()
	pulse: number
}
