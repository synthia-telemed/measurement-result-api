import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, PipelineStage } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import * as weekOfYear from 'dayjs/plugin/weekOfYear'
import * as _ from 'lodash'
import { CreateBloodPressureDto } from './dto/create-blood-pressure.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { Granularity } from './dto/patient-visualization-request.dto'
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(weekOfYear)

const TZ = 'Asia/Bangkok'

export interface BloodPressureVisualizationData {
	label: string
	values?: number[]
}

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

	async getAverageWithCategoricalLabel(
		patientID: number,
		startDate: Date,
		endDate: Date,
		granularity: Granularity.MONTH | Granularity.WEEK
	): Promise<BloodPressureVisualizationData[]> {
		const st = dayjs(startDate).tz(TZ).startOf('day').utc()
		const et = dayjs(endDate).tz(TZ).endOf('day').utc()
		let createIndexOp: any
		let labels: string[]
		switch (granularity) {
			case Granularity.MONTH:
				createIndexOp = {
					$subtract: [
						{ $week: { date: '$dateTime', timezone: TZ } },
						{ $week: { date: st.toDate(), timezone: TZ } },
					],
				}
				labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6']
				break
			case Granularity.WEEK:
				createIndexOp = { $subtract: [{ $dayOfWeek: { date: '$dateTime', timezone: TZ } }, 1] }
				labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
				break
		}

		const results = await this.bloodPressureModel
			.aggregate([
				{ $match: { dateTime: { $gte: st.toDate(), $lte: et.toDate() }, 'metadata.patientID': patientID } },
				{ $addFields: { index: createIndexOp } },
				{
					$group: {
						_id: '$index',
						systolic: { $avg: '$systolic' },
						diastolic: { $avg: '$diastolic' },
						// pulse: { $avg: '$pulse' },
						sortIndex: { $first: '$dateTime' },
					},
				},
				{
					$addFields: {
						label: { $arrayElemAt: [labels, '$_id'] },
					},
				},
				{ $sort: { sortIndex: 1 } },
				{ $unset: 'sortIndex' },
			])
			.exec()

		const resultsObj = _.keyBy(results, '_id')
		const visDatas: BloodPressureVisualizationData[] = []
		const timeDuration: dayjs.OpUnitType = granularity === Granularity.WEEK ? 'day' : 'week'
		let runner = st.clone().tz(TZ)
		for (let i = 0; i < labels.length && !runner.isAfter(et.tz(TZ), timeDuration); i++) {
			const index = granularity === Granularity.WEEK ? runner.day() : runner.week() - st.week()
			const visData: BloodPressureVisualizationData = { label: labels[index] }
			const result = resultsObj[index]
			if (result) visData.values = [result.diastolic, result.systolic]
			visDatas.push(visData)
			runner = runner.add(1, timeDuration)
		}
		return visDatas
	}
}
