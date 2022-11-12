import { ApiProperty } from '@nestjs/swagger'
import { Status } from 'src/base/model'
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

export class GlucoseSummary {
	@ApiProperty({ nullable: true })
	value?: number

	@ApiProperty({ enum: Status })
	status: Status
}

export class GlucoseVisualizationResponseDto extends VisualizationResponseDto<GlucoseVisualizationDatas> {
	@ApiProperty()
	data: GlucoseVisualizationDatas

	@ApiProperty()
	summary: GlucoseSummary
}
