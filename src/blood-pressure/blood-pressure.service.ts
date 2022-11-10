import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import * as weekOfYear from 'dayjs/plugin/weekOfYear'
import * as duration from 'dayjs/plugin/duration'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import {
	BloodPressureSummary,
	BloodPressureVisualizationData,
} from './dto/patient-visualization-blood-pressure-res.dto'
import { Status } from 'src/base/model'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)
dayjs.extend(duration)

const TZ = 'Asia/Bangkok'

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

	async getDayResults(patientID: number, sinceDate: Date, toDate: Date): Promise<BloodPressureVisualizationData[]> {
		const results = await this.bloodPressureModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
					},
				},
				{ $project: { dateTime: 1, systolic: 1, diastolic: 1, pulse: 1 } },
				{ $sort: { dateTime: 1 } },
			])
			.exec()
		return results.map(result => ({
			label: dayjs(result.dateTime).utc().unix(),
			values: [result.diastolic, result.systolic],
		}))
	}

	async getDayAverage(patientID: number, sinceDate: Date, toDate: Date): Promise<BloodPressureVisualizationData[]> {
		const results = await this.bloodPressureModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
					},
				},
				{ $addFields: { index: { $dayOfMonth: { date: '$dateTime', timezone: TZ } } } },
				{
					$group: {
						_id: '$index',
						systolic: { $avg: '$systolic' },
						diastolic: { $avg: '$diastolic' },
						dateTime: { $first: '$dateTime' },
					},
				},
				{ $sort: { dateTime: 1 } },
			])
			.exec()

		const visDatas: BloodPressureVisualizationData[] = results.map(result => ({
			label: dayjs(result.dateTime).startOf('day').utc().unix(),
			values: [result.diastolic, result.systolic],
		}))
		return visDatas
	}
}
