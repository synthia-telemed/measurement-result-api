import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum } from 'class-validator'

export enum Granularity {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
}

export class PatientBloodPressureVisualizationRequestDto {
	@ApiProperty()
	@IsEnum(Granularity)
	granularity: Granularity

	@ApiProperty()
	@IsDateString()
	startDate: Date

	@ApiProperty()
	@IsDateString()
	endDate: Date
}
