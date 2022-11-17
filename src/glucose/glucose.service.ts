import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import { Glucose, Period } from './schema/glucose.schema'
import { Status } from 'src/base/model'
import {
	GlucoseVisualizationData,
	GlucoseVisualizationDatas,
	GlucoseVisualizationDataWithPeriod,
} from './dto/visualization-glucose.dto'
import { BaseService } from 'src/base/base.service'
import { PatientLatestGlucose, PatientLatestGlucoseAllPeriod } from './dto/patient-latest-glucose.dto'
import { DoctorGlucoseStatus } from './dto/doctor-visualization.dto'
dayjs.extend(utc)
dayjs.extend(timezone)

interface GlucoseAverageResult {
	_id: Period
	value: number
}

@Injectable()
export class GlucoseService extends BaseService {
	readonly unit = 'mg/dL'
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

	async getTodayLatestResultAllPeriod(patientID: number): Promise<PatientLatestGlucoseAllPeriod> {
		const { sinceDate, toDate } = this.getTodayDateRange()
		const results = await this.glucoseModel.aggregate([
			{
				$match: { dateTime: { $gte: sinceDate, $lte: toDate }, 'metadata.patientID': patientID },
			},
			{
				$project: { 'metadata.period': true, dateTime: true, value: true },
			},
			{
				$sort: { dateTime: -1 },
			},
			{
				$group: { _id: '$metadata.period', dateTime: { $first: '$dateTime' }, value: { $first: '$value' } },
			},
		])
		const allPeriod: PatientLatestGlucoseAllPeriod = {}
		for (const { _id: period, dateTime, value } of results) {
			const data: PatientLatestGlucose = {
				dateTime,
				value,
				unit: this.unit,
				status: this.getStatus(period, value),
			}
			allPeriod[this.parsePeriodToResponse(period)] = data
		}
		return allPeriod
	}

	parsePeriodToResponse(period: Period): string {
		switch (period) {
			case Period.AfterMeal:
				return 'afterMeal'
			case Period.BeforeMeal:
				return 'beforeMeal'
			default:
				return 'fasting'
		}
	}

	async getLastestResult(patientID: number, sinceDate: Date, toDate: Date): Promise<Glucose | null> {
		return this.glucoseModel
			.findOne({ 'metadata.patientID': patientID, dateTime: { $gte: sinceDate, $lte: toDate } })
			.sort({ dateTime: -1 })
	}

	async getAverage(patientID: number, sinceDate: Date, toDate: Date): Promise<GlucoseAverageResult[]> {
		const results = await this.glucoseModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
					},
				},
				{ $group: { _id: '$metadata.period', value: { $avg: '$value' } } },
			])
			.exec()
		return results
	}

	getStatusFromAverage(results: GlucoseAverageResult[]): Status {
		let status = Status.NORMAL
		for (const { _id: period, value } of results) {
			const periodStatus = this.getStatus(period, value)
			if (periodStatus === Status.ABNORMAL) return Status.ABNORMAL
			else if (periodStatus === Status.WARNING) status = Status.WARNING
		}
		return status
	}

	getStatus(period: Period, value: number): Status {
		switch (period) {
			case Period.Fasting:
				if (value >= 126 || value < 69) return Status.ABNORMAL
				if (value >= 100) return Status.WARNING
				break
			case Period.BeforeMeal:
				if (value >= 240 || value < 70) return Status.ABNORMAL
				break
			case Period.AfterMeal:
				if (value >= 240 || value < 70) return Status.ABNORMAL
				break
		}
		return Status.NORMAL
	}

	private getColorFromPeriodAndValue(period: Period, value: number): string {
		const status = this.getStatus(period, value)
		// TODO: Discuss the color
		switch (status) {
			case Status.ABNORMAL:
				return '#131957'
			case Status.WARNING:
				return '#2632AE'
			default:
				return '#4F84F6'
		}
	}

	async getDayVisualizationData(
		patientID: number,
		sinceDate: Date,
		toDate: Date
	): Promise<GlucoseVisualizationDataWithPeriod[]> {
		const results = await this.glucoseModel
			.find({ 'metadata.patientID': patientID, dateTime: { $gte: sinceDate, $lte: toDate } })
			.sort({ dateTime: -1 })
			.lean()
			.exec()
		return results.map(result => ({
			label: this.labelTimeParser(false, result.dateTime),
			value: result.value,
			period: this.parsePeriodToDisplayable(result.metadata.period),
		}))
	}

	parsePeriodToDisplayable(period: Period): string {
		switch (period) {
			case Period.AfterMeal:
				return 'After Meal'
			case Period.BeforeMeal:
				return 'Before Meal'
			default:
				return 'Fasting'
		}
	}

	async getAggregatedVisualizationDatas(
		patientID: number,
		sinceDate: Date,
		toDate: Date
	): Promise<GlucoseVisualizationDatas> {
		const periods: Period[] = [Period.Fasting, Period.BeforeMeal, Period.AfterMeal]
		const ops = periods.map(period =>
			this.getAggregatedVisualizationDataByPeriod(patientID, sinceDate, toDate, period)
		)
		const [fasting, beforeMeal, afterMeal] = await Promise.all(ops)
		return {
			fasting,
			beforeMeal,
			afterMeal,
		}
	}

	async getAggregatedVisualizationDataByPeriod(
		patientID: number,
		sinceDate: Date,
		toDate: Date,
		period: Period
	): Promise<GlucoseVisualizationData[]> {
		const results = await this.glucoseModel
			.aggregate([
				{
					$match: {
						dateTime: { $gte: sinceDate, $lte: toDate },
						'metadata.patientID': patientID,
						'metadata.period': period,
					},
				},
				{ $addFields: { index: { $dayOfYear: { date: '$dateTime', timezone: this.TZ } } } },
				{ $group: { _id: '$index', value: { $avg: '$value' }, dateTime: { $first: '$dateTime' } } },
				{ $sort: { dateTime: 1 } },
			])
			.exec()
		return results.map(result => ({
			label: this.labelTimeParser(true, result.dateTime),
			value: result.value,
		}))
	}

	async getAbnormalGlucoseResult(patientID: number, sinceDate: Date, toDate: Date) {
		const results = await this.glucoseModel
			.find({
				$and: [
					{ 'metadata.patientID': patientID },
					{ dateTime: { $gte: sinceDate, $lte: toDate } },
					{
						$or: [
							{ 'metadata.period': Period.Fasting, value: { $gte: 100 } },
							{ 'metadata.period': Period.Fasting, value: { $lt: 69 } },
							{ 'metadata.period': Period.BeforeMeal, value: { $gte: 240 } },
							{ 'metadata.period': Period.BeforeMeal, value: { $lt: 70 } },
							{ 'metadata.period': Period.AfterMeal, value: { $gte: 240 } },
							{ 'metadata.period': Period.AfterMeal, value: { $lt: 70 } },
						],
					},
				],
			})
			.lean()
			.exec()
		return results
	}

	getDoctorGlucoseStatus(period: Period, value: number): DoctorGlucoseStatus {
		switch (period) {
			case Period.Fasting:
				if (value >= 126) return DoctorGlucoseStatus.HYPERGLYCEMIA
				if (value >= 100) return DoctorGlucoseStatus.Warning
				if (value < 69) return DoctorGlucoseStatus.HYPOGLYCEMIA
				break
			case Period.BeforeMeal:
				if (value >= 240) return DoctorGlucoseStatus.HYPERGLYCEMIA
				if (value < 70) return DoctorGlucoseStatus.HYPOGLYCEMIA
				break
			case Period.AfterMeal:
				if (value >= 240) return DoctorGlucoseStatus.HYPERGLYCEMIA
				if (value < 70) return DoctorGlucoseStatus.HYPOGLYCEMIA
				break
		}
		return DoctorGlucoseStatus.NORMAL
	}
}
