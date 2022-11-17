import { ApiProperty } from '@nestjs/swagger'
import { VisualizationResponseDto } from 'src/dto/visualization-response.dto'
import { BloodPressureVisualizationData, BloodPressureSummary } from './patient-visualization-blood-pressure.dto'

export class BloodPressureAbnormalResult {
	@ApiProperty()
	systolic: number
	@ApiProperty()
	diastolic: number
	@ApiProperty()
	dateTime: Date
}

export class BloodPressureAbnormalResultSummary {
	@ApiProperty({ isArray: true, type: BloodPressureAbnormalResult })
	warning: BloodPressureAbnormalResult[]

	@ApiProperty({ isArray: true, type: BloodPressureAbnormalResult })
	abnormal: BloodPressureAbnormalResult[]
}

export class DoctorBloodPressureVisualizationResponseDto extends VisualizationResponseDto<
	BloodPressureVisualizationData[]
> {
	@ApiProperty({ isArray: true, type: BloodPressureVisualizationData })
	data: BloodPressureVisualizationData[]

	@ApiProperty()
	summary: BloodPressureSummary

	@ApiProperty()
	abnormalResults: BloodPressureAbnormalResultSummary
}
