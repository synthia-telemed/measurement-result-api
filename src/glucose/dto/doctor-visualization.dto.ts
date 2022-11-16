import { ApiProperty } from '@nestjs/swagger'
import { VisualizationResponseDto } from 'src/dto/visualization-response.dto'
import { GlucoseVisualizationDatas } from './visualization-glucose.dto'

export enum DoctorGlucoseStatus {
	NORMAL = 'Normal',
	Warning = 'Warning',
	HYPOGLYCEMIA = 'Hypoglycemia',
	HYPERGLYCEMIA = 'Hyperglycemia',
}

export class GlucoseAbnormalResult {
	@ApiProperty()
	value: number
	@ApiProperty()
	dateTime: Date
}

export class GlucoseAbnormalResultSummary {
	@ApiProperty({ isArray: true, type: GlucoseAbnormalResult })
	normal: GlucoseAbnormalResult[]

	@ApiProperty({ isArray: true, type: GlucoseAbnormalResult, nullable: true })
	warning?: GlucoseAbnormalResult[]

	@ApiProperty({ isArray: true, type: GlucoseAbnormalResult })
	hypoglycemia: GlucoseAbnormalResult[]

	@ApiProperty({ isArray: true, type: GlucoseAbnormalResult })
	hyperglycemia: GlucoseAbnormalResult[]
}

export class DoctorGlucoseSummary {
	@ApiProperty()
	fasting: GlucoseAbnormalResultSummary

	@ApiProperty()
	beforeMeal: GlucoseAbnormalResultSummary

	@ApiProperty()
	afterMeal: GlucoseAbnormalResultSummary
}

export class DoctorGlucoseVisualizationResponseDto extends VisualizationResponseDto<GlucoseVisualizationDatas> {
	@ApiProperty()
	data: GlucoseVisualizationDatas

	@ApiProperty()
	summary: DoctorGlucoseSummary
}
