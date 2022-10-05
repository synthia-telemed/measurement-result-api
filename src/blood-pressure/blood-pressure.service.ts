import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BloodPressure } from './schema/blood-pressure.schema'

@Injectable()
export class BloodPressureService {
	constructor(@InjectModel(BloodPressure.name) private readonly bloodPressureModel: Model<BloodPressure>) {}

	async create() {
		await this.bloodPressureModel.create({
			dateTime: new Date(),
			value: 10,
			metadata: {
				patientID: 2,
				createdAt: new Date(),
			},
		})
	}
}
