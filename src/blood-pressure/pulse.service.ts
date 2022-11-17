import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { Model } from 'mongoose'
import { BaseService } from 'src/base/base.service'
import { Status } from 'src/base/model'
import { PulseSummary, PulseVisualizationData } from './dto/patient-visualization-pulse.dto'
import { BloodPressure } from './schema/blood-pressure.schema'
import { PatientLatestPulse } from './dto/patient-latest-pulse.dto'
import { PrismaService } from 'src/prisma.service'
import { HospitalService } from 'src/hospital/hospital.service'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class PulseService extends BaseService {
	readonly unit = 'bpm'
	constructor(
		@InjectModel(BloodPressure.name) private readonly bloodPressureModel: Model<BloodPressure>,
		private readonly prisma: PrismaService,
		private readonly hospitalService: HospitalService
	) {
		super()
	}

	async getTodayLatestResult(patientID: number): Promise<PatientLatestPulse> {
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
		const age = await this.getPatientAge(patientID)
		return {
			dateTime: result.dateTime,
			value: result.pulse,
			status: this.getStatus(result.pulse, age),
			unit: this.unit,
		}
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
		const age = await this.getPatientAge(patientID)
		return {
			pulse: results[0].avgPulse,
			status: this.getStatus(results[0].avgPulse, age),
		}
	}

	private async getPatientAge(patientID: number): Promise<number> {
		const { ref_id } = await this.prisma.patients.findFirst({
			select: { ref_id: true },
			where: { id: patientID },
		})
		const patient = await this.hospitalService.getPatientBirthDate(ref_id)
		return dayjs().tz(this.TZ).diff(dayjs.utc(patient.birthDate), 'year')
	}

	private getStatus(pulse: number, age: number): Status {
		const max = 220 - age
		if (pulse > max) return Status.ABNORMAL
		if (pulse > max * 0.85) return Status.WARNING
		return Status.NORMAL
	}

	private getColorFromPulse(pulse: number, age: number): string {
		// TODO: discuss the color range
		const status = this.getStatus(pulse, age)
		switch (status) {
			case Status.ABNORMAL:
				return '#131957'
			case Status.WARNING:
				return '#2632AE'
			default:
				return '#4F84F6'
		}
	}

	async getVisualizationData(
		patientID: number,
		sinceDate: Date,
		toDate: Date,
		isAggregate: boolean
	): Promise<PulseVisualizationData[]> {
		let aggregateSteps: any[] = [
			{ $addFields: { index: { $dayOfYear: { date: '$dateTime', timezone: this.TZ } } } },
			{
				$group: {
					_id: '$index',
					pulse: { $avg: '$pulse' },
					dateTime: { $first: '$dateTime' },
				},
			},
		]
		if (!isAggregate) aggregateSteps = [{ $project: { dateTime: 1, pulse: 1 } }]

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
		const age = await this.getPatientAge(patientID)
		return results.map(({ dateTime, pulse }) => ({
			label: this.labelTimeParser(isAggregate, dateTime),
			values: pulse,
			color: this.getColorFromPulse(pulse, age),
		}))
	}
}
