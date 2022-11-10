import { ApiProperty } from '@nestjs/swagger'
import { Status, VisualizationData } from 'src/base/model'
import { VisualizationResponseDto } from 'src/dto/visualization-response.dto'

export class BloodPressureVisualizationData extends VisualizationData {
	@ApiProperty({ isArray: true, type: Number })
	values?: number[]
}

export class BloodPressureSummary {
	@ApiProperty()
	systolic: number
	@ApiProperty()
	diastolic: number
	@ApiProperty({ enum: Status })
	status: Status
}

export class BloodPressureVisualizationResponseDto extends VisualizationResponseDto<BloodPressureVisualizationData> {
	@ApiProperty({ isArray: true, type: BloodPressureVisualizationData })
	data: BloodPressureVisualizationData[]

	@ApiProperty()
	summary: BloodPressureSummary
}
