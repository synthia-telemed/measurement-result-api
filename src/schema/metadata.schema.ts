import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { ApiProperty } from '@nestjs/swagger'
import { Document } from 'mongoose'

@Schema({ _id: false })
export class Metadata extends Document {
	@ApiProperty()
	@Prop({ required: true })
	patientID: number

	@ApiProperty()
	@Prop({ default: new Date() })
	createdAt: Date
}
export const MetadataSchema = SchemaFactory.createForClass(Metadata)
