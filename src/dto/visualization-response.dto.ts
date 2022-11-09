import { ApiProperty } from '@nestjs/swagger'

export class VisualizationResponseDto<T> {
	@ApiProperty({ isArray: true, type: Number })
	ticks: number[]

	@ApiProperty()
	xLabel: string

	@ApiProperty()
	unit: string

	data: T[]
}
