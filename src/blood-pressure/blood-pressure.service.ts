import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'

@Injectable()
export class BloodPressureService {
	constructor(@InjectModel(BloodPressure.name) private readonly bloodPressureModel: Model<BloodPressure>) {}

	async create({ dateTime, diastolic, pulse, systolic }: CreateBloodPressureDto, patientID: number) {
		return this.bloodPressureModel.create({
			dateTime,
			systolic,
			diastolic,
			pulse,
			metadata: {
				patientID,
				createdAt: new Date(),
			},
		})
	}
}
