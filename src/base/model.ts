import { ApiProperty } from '@nestjs/swagger'

export enum Status {
	LOW = 'Low',
	NORMAL = 'Normal',
	WARNING = 'Warning',
	ABNORMAL = 'Abnormal',
}

export enum Granularity {
	DAY = 'day',
	WEEK = 'week',
	MONTH = 'month',
}

export class VisualizationData {
	@ApiProperty()
	label: number
}
