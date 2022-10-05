import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document } from 'mongoose'

@Schema({ _id: false })
export class Metadata extends Document {
	@Prop({ required: true })
	patientID: number
	@Prop({ default: new Date() })
	createdAt: Date
}
export const MetadataSchema = SchemaFactory.createForClass(Metadata)
