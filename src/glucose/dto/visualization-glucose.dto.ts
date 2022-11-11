import { ApiProperty } from '@nestjs/swagger'
import { VisualizationData, VisualizationResponseDto } from 'src/dto/visualization-response.dto'

export class GlucoseVisualizationData extends VisualizationData {
	@ApiProperty()
	value: number
}

export class GlucoseVisualizationDatas {
	@ApiProperty()
	fasting: GlucoseVisualizationData[]

	@ApiProperty()
	beforeMeal: GlucoseVisualizationData[]

	@ApiProperty()
	afterMeal: GlucoseVisualizationData[]
}

export class GlucoseVisualizationResponseDto extends VisualizationResponseDto<GlucoseVisualizationDatas> {
	@ApiProperty()
	data: GlucoseVisualizationDatas
}
