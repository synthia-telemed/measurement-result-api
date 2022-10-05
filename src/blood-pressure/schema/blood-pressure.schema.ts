import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
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
	@Prop({ required: true })
	dateTime: Date

	@Prop({ required: true, type: MetadataSchema })
	metadata: Metadata

	@Prop({ required: true })
	systolic: number

	@Prop({ required: true })
	diastolic: number

	@Prop({ required: true })
	pulse: number
}

export const BloodPressureSchema = SchemaFactory.createForClass(BloodPressure)
