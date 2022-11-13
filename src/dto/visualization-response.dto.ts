import { ApiProperty } from '@nestjs/swagger'

export class VisualizationResponseDto<T> {
	@ApiProperty({ isArray: true, type: Number })
	ticks: number[]

	@ApiProperty()
	xLabel: string

	@ApiProperty()
	unit: string

	@ApiProperty({ isArray: true, type: Number })
	domain: number[]

	data: T
}

export class VisualizationData {
	@ApiProperty()
	label: number

	@ApiProperty({ nullable: true })
	color?: string
}
