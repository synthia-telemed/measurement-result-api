import { Document } from 'mongoose'
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose'
import { ApiProperty } from '@nestjs/swagger'
import { Metadata } from 'src/schema/metadata.schema'

export enum Meal {
	Breakfast = 'breakfast',
	Lunch = 'lunch',
	Dinner = 'dinner',
}

@Schema()
export class GlucoseMetadata extends Metadata {
	@ApiProperty()
	@Prop({ required: true })
	isBeforeMeal: boolean

	@ApiProperty({ enum: Meal })
	@Prop({ type: String, enum: [Meal.Breakfast, Meal.Lunch, Meal.Dinner] })
	meal: Meal
}
export const GlucoseMetadataSchema = SchemaFactory.createForClass(GlucoseMetadata)

@Schema({
	timeseries: {
		timeField: 'dateTime',
		granularity: 'hours',
		metaField: 'metadata',
	},
})
export class Glucose extends Document {
	@ApiProperty()
	@Prop({ required: true })
	dateTime: Date

	@ApiProperty()
	@Prop({ required: true, type: GlucoseMetadataSchema })
	metadata: GlucoseMetadata

	@ApiProperty()
	@Prop({ required: true })
	value: number
}

export const GlucoseSchema = SchemaFactory.createForClass(Glucose)
