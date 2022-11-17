import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { LeanDocument, Model } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { BloodPressureSummary, BloodPressureVisualizationData } from './dto/patient-visualization-blood-pressure.dto'
import { Status } from 'src/base/model'
import { BaseService } from 'src/base/base.service'
import { PatientLatestBloodPressure } from './dto/patient-latest-blood-pressure.dto'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class BloodPressureService extends BaseService {
	readonly unit = 'mmHg'
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

	async getTodayLatestResult(patientID: number): Promise<PatientLatestBloodPressure> {
		const { sinceDate, toDate } = this.getTodayDateRange()
		const result = await this.bloodPressureModel
			.findOne({
				'metadata.patientID': patientID,
				dateTime: { $gte: sinceDate, $lte: toDate },
			})
			.sort({ dateTime: -1 })
			.lean()
			.exec()
		if (!result) return undefined
		const status = this.getStatusFromBloodPressure(result.systolic, result.diastolic)
		return {
			dateTime: result.dateTime,
			systolic: result.systolic,
			diastolic: result.diastolic,
			status,
			unit: this.unit,
		}
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
		if (systolic < 90 || diastolic < 60) return Status.ABNORMAL
		return Status.NORMAL
	}

	private getColorFromBloodPressure(systolic: number, diastolic: number): string {
		const status = this.getStatusFromBloodPressure(systolic, diastolic)
		switch (status) {
			case Status.ABNORMAL:
				return '#131957'
			case Status.WARNING:
				return '#2632AE'
			default:
				return '#5965E1'
		}
	}

	async getVisualizationData(
		patientID: number,
		sinceDate: Date,
		toDate: Date,
		isAggregate: boolean
	): Promise<BloodPressureVisualizationData[]> {
		let aggregateSteps: any[] = [
			{ $addFields: { index: { $dayOfYear: { date: '$dateTime', timezone: this.TZ } } } },
			{
				$group: {
					_id: '$index',
					systolic: { $avg: '$systolic' },
					diastolic: { $avg: '$diastolic' },
					dateTime: { $first: '$dateTime' },
				},
			},
		]
		if (!isAggregate) aggregateSteps = [{ $project: { dateTime: 1, systolic: 1, diastolic: 1 } }]

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

		const visDatas: BloodPressureVisualizationData[] = results.map(({ dateTime, systolic, diastolic }) => ({
			label: this.labelTimeParser(isAggregate, dateTime),
			values: [diastolic, systolic],
			color: this.getColorFromBloodPressure(systolic, diastolic),
		}))
		return visDatas
	}

	async getAbnormalResults(patientID: number, sinceDate: Date, toDate: Date): Promise<LeanDocument<BloodPressure>[]> {
		return await this.bloodPressureModel
			.find({
				$and: [
					{ 'metadata.patientID': patientID },
					{ dateTime: { $gte: sinceDate, $lte: toDate } },
					{
						$or: [
							{ systolic: { $gt: 120 } },
							{ systolic: { $lt: 90 } },
							{ diastolic: { $gt: 80 } },
							{ diastolic: { $lt: 60 } },
						],
					},
				],
			})
			.lean()
			.exec()
	}
}
