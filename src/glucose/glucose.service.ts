import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import { Glucose, Period } from './schema/glucose.schema'
import { Granularity } from 'src/base/model'
import { GlucoseVisualizationData, GlucoseVisualizationDatas } from './dto/visualization-glucose.dto'
import { BaseService } from 'src/base/base.service'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class GlucoseService extends BaseService {
	constructor(@InjectModel(Glucose.name) private readonly glucoseModel: Model<Glucose>) {
		super()
	}

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

	async getVisualizationDatas(
		patientID: number,
		granularity: Granularity,
		sinceDate: Date,
		toDate: Date
	): Promise<GlucoseVisualizationDatas> {
		const periods: Period[] = [Period.Fasting, Period.BeforeMeal, Period.AfterMeal]
		const ops = periods.map(period =>
			this.getVisualizationDataByPeriod(patientID, granularity, sinceDate, toDate, period)
		)
		const [fasting, beforeMeal, afterMeal] = await Promise.all(ops)
		return {
			fasting,
			beforeMeal,
			afterMeal,
		}
	}

	async getVisualizationDataByPeriod(
		patientID: number,
		granularity: Granularity,
		sinceDate: Date,
		toDate: Date,
		period: Period
	): Promise<GlucoseVisualizationData[]> {
		let aggregateSteps: any[] = [
			{ $addFields: { index: { $dayOfMonth: { date: '$dateTime', timezone: this.TZ } } } },
			{ $group: { _id: '$index', value: { $avg: '$value' } } },
		]
		if (granularity === Granularity.DAY) aggregateSteps = [{ $project: { value: 1 } }]

		const results = await this.glucoseModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
						'metadata.period': period,
					},
				},
				...aggregateSteps,
				{ $sort: { dateTime: 1 } },
			])
			.exec()
		return results.map(result => ({
			label: this.labelTimeParser(granularity, result.dateTime),
			value: result.value,
		}))
	}
}
