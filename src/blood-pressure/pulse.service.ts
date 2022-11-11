import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { Model } from 'mongoose'
import { BaseService } from 'src/base/base.service'
import { Granularity, Status } from 'src/base/model'
import { PulseSummary, PulseVisualizationData } from './dto/patient-visualization-pulse.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class PulseService extends BaseService {
	constructor(@InjectModel(BloodPressure.name) private readonly bloodPressureModel: Model<BloodPressure>) {
		super()
	}

	async getSummary(patientID: number, sinceDate: Date, toDate: Date): Promise<PulseSummary> {
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
						avgPulse: { $avg: '$pulse' },
					},
				},
			])
			.exec()
		if (results.length === 0) return undefined
		return {
			pulse: results[0].avgPulse,
			status: this.getStatus(results[0].avgPulse),
		}
	}

	private getStatus(avgPulse: number): Status {
		if (avgPulse > 170) return Status.WARNING
		if (avgPulse < 100) return Status.LOW
		return Status.NORMAL
	}

	async getVisualizationData(
		patientID: number,
		granularity: Granularity,
		sinceDate: Date,
		toDate: Date
	): Promise<PulseVisualizationData[]> {
		let aggregateSteps: any[] = [
			{ $addFields: { index: { $dayOfMonth: { date: '$dateTime', timezone: this.TZ } } } },
			{
				$group: {
					_id: '$index',
					pulse: { $avg: '$pulse' },
					dateTime: { $first: '$dateTime' },
				},
			},
		]
		if (granularity === Granularity.DAY) aggregateSteps = [{ $project: { dateTime: 1, pulse: 1 } }]

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

		return results.map(result => ({
			label: this.labelTimeParser(granularity, result.dateTime),
			values: result.pulse,
		}))
	}
}
