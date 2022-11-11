import { ApiProperty } from '@nestjs/swagger'
import { VisualizationData, VisualizationResponseDto } from 'src/dto/visualization-response.dto'

export class GlucoseVisualizationData extends VisualizationData {
	@ApiProperty()
	value: number
}

export class GlucoseVisualizationResponseDto extends VisualizationResponseDto<GlucoseVisualizationData> {
	@ApiProperty({ isArray: true, type: GlucoseVisualizationData })
	data: GlucoseVisualizationData[]
}
