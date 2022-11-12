import { ApiProperty } from '@nestjs/swagger'
import { Status } from 'src/base/model'
import { VisualizationData, VisualizationResponseDto } from 'src/dto/visualization-response.dto'

export class PulseSummary {
	@ApiProperty()
	pulse: number
	@ApiProperty({ enum: Status })
	status: Status
}

export class PulseVisualizationData extends VisualizationData {
	@ApiProperty()
	values?: number
}

export class PulseVisualizationResponseDto extends VisualizationResponseDto<PulseVisualizationData[]> {
	@ApiProperty({ isArray: true, type: PulseVisualizationData })
	data: PulseVisualizationData[]

	@ApiProperty()
	summary: PulseSummary
}
