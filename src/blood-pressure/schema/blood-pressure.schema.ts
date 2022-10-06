import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ApiProperty } from '@nestjs/swagger'
import { Document } from 'mongoose'
import { Metadata, MetadataSchema } from 'src/schema/metadata.schema'

@Schema({
	timeseries: {
		timeField: 'dateTime',
		granularity: 'hours',
		metaField: 'metadata',
	},
})
export class BloodPressure extends Document {
	@ApiProperty()
	@Prop({ required: true })
	dateTime: Date

	@ApiProperty()
	@Prop({ required: true, type: MetadataSchema })
	metadata: Metadata

	@ApiProperty()
	@Prop({ required: true })
	systolic: number

	@ApiProperty()
	@Prop({ required: true })
	diastolic: number

	@ApiProperty()
	@Prop({ required: true })
	pulse: number
}

export const BloodPressureSchema = SchemaFactory.createForClass(BloodPressure)
