import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BloodPressureSummary, BloodPressureVisualizationData } from './dto/patient-visualization-blood-pressure.dto'
import { Granularity, Status } from 'src/base/model'
import { BaseService } from 'src/base/base.service'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class BloodPressureService extends BaseService {
	constructor(@InjectModel(BloodPressure.name) private readonly bloodPressureModel: Model<BloodPressure>) {
		super()
	}

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

	async getAverage(patientID: number, sinceDate: Date, toDate: Date): Promise<BloodPressureSummary> {
		const results = await this.bloodPressureModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
					},
				},
				{
					$group: {
						_id: null,
						avgSystolic: { $avg: '$systolic' },
						avgDiastolic: { $avg: '$diastolic' },
					},
				},
			])
			.exec()
		if (results.length === 0) return undefined
		const status = this.getStatusFromBloodPressure(results[0].avgSystolic, results[0].avgDiastolic)
		const avg: BloodPressureSummary = {
			systolic: results[0].avgSystolic,
			diastolic: results[0].avgDiastolic,
			status,
		}
		return avg
	}

	getStatusFromBloodPressure(systolic: number, diastolic: number): Status {
		if (systolic > 140 || diastolic > 90) return Status.ABNORMAL
		if (systolic > 120 || diastolic > 80) return Status.WARNING
		if (systolic > 90 || diastolic > 60) return Status.NORMAL
		return Status.LOW
	}

	async getVisualizationData(
		patientID: number,
		granularity: Granularity,
		sinceDate: Date,
		toDate: Date
	): Promise<BloodPressureVisualizationData[]> {
		let timeParser = (dateTime: Date) => dayjs(dateTime).startOf('day').utc().unix()
		let aggregateSteps: any[] = [
			{ $addFields: { index: { $dayOfMonth: { date: '$dateTime', timezone: this.TZ } } } },
			{
				$group: {
					_id: '$index',
					systolic: { $avg: '$systolic' },
					diastolic: { $avg: '$diastolic' },
					dateTime: { $first: '$dateTime' },
				},
			},
		]
		if (granularity === Granularity.DAY) {
			timeParser = (dateTime: Date) => dayjs(dateTime).utc().unix()
			aggregateSteps = [{ $project: { dateTime: 1, systolic: 1, diastolic: 1 } }]
		}
		const results = await this.bloodPressureModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
					},
				},
				...aggregateSteps,
				{ $sort: { dateTime: 1 } },
			])
			.exec()

		const visDatas: BloodPressureVisualizationData[] = results.map(result => ({
			label: timeParser(result.dateTime),
			values: [result.diastolic, result.systolic],
		}))
		return visDatas
	}
}
