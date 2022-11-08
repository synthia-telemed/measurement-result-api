import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import { Glucose } from './schema/glucose.schema'

@Injectable()
export class GlucoseService {
	constructor(@InjectModel(Glucose.name) private readonly glucoseModel: Model<Glucose>) {}

	async create({ dateTime, value, period }: CreateGlucoseDto, patientID: number) {
		return this.glucoseModel.create({
			dateTime,
			value,
			metadata: {
				patientID,
				createdAt: new Date(),
				period,
			},
		})
	}
}
