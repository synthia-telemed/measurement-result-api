import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsEnum, IsNumber } from 'class-validator'
import { Period } from '../schema/glucose.schema'

export class CreateGlucoseDto {
	@ApiProperty()
	@IsDateString()
	dateTime: Date

	@ApiProperty()
	@IsNumber()
	value: number

	@ApiProperty({ enum: Period })
	@IsEnum(Period)
	period: Period
}
