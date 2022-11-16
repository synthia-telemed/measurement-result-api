import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum } from 'class-validator'
import { PatientGranularity } from 'src/base/model'

export class PatientVisualizationRequestDto {
	@ApiProperty({ enum: PatientGranularity })
	@IsEnum(PatientGranularity)
	granularity: PatientGranularity

	@ApiProperty({
		description:
			'if you can data from Sep 02, 2022 to Aug 02, 2022, you should pass 2022-09-02 and set granularity to month',
	})
	@IsDateString()
	date: Date
}
