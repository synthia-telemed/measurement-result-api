import { IsDateString, IsNumber } from 'class-validator'

export class CreateBloodPressureDto {
	@IsDateString()
	dateTime: Date

	@IsNumber()
	systolic: number

	@IsNumber()
	diastolic: number

	@IsNumber()
	pulse: number
}
