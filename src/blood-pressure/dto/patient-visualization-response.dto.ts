import { ApiProperty } from '@nestjs/swagger'
import { VisualizationResponseDto } from 'src/dto/visualization-response.dto'

export class BloodPressureVisualizationData {
	@ApiProperty()
	label: string

	@ApiProperty({ isArray: true, type: Number })
	values?: number[]
}

export class BloodPressureVisualizationResponseDto extends VisualizationResponseDto<BloodPressureVisualizationData> {
	@ApiProperty({ isArray: true, type: BloodPressureVisualizationData })
	data: BloodPressureVisualizationData[]
}
