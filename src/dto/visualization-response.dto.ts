import { ApiProperty } from '@nestjs/swagger'

export class VisualizationResponseDto<T> {
	@ApiProperty()
	xLabel: string

	@ApiProperty()
	unit: string

	@ApiProperty()
	isNumerical: boolean

	data: T[]
}
