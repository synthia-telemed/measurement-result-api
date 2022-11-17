import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/timezone'
import { VisualizationData } from 'src/dto/visualization-response.dto'
import { PatientGranularity } from './model'
dayjs.extend(timezone)
dayjs.extend(utc)

export class BaseController {
	TZ = 'Asia/Bangkok'

	isAggregate(granularity: PatientGranularity): boolean {
		return granularity !== PatientGranularity.DAY
	}

	parseUTCDateToDayjs(date: Date): dayjs.Dayjs {
		return dayjs.utc(date).tz(this.TZ)
	}

	getXLabel(granularity: PatientGranularity, date: Date): string {
		switch (granularity) {
			case PatientGranularity.DAY:
				return 'Time'
			default:
				const { sinceDate, toDate } = this.getSinceAndToDayjs(granularity, date)
				const dateFormat = 'DD MMM'
				return `${sinceDate.format(dateFormat)}-${toDate.format(dateFormat)}`
		}
	}

	getDoctorXLabel(from: dayjs.Dayjs, to: dayjs.Dayjs): string {
		const dateFormat = 'D MMM YYYY'
		return `${from.format(dateFormat)} - ${to.format(dateFormat)}`
	}

	getSinceAndToDayjs(granularity: PatientGranularity, date: Date): { sinceDate: dayjs.Dayjs; toDate: dayjs.Dayjs } {
		const sinceDate = dayjs(date).tz(this.TZ).subtract(1, granularity).add(1, 'day').startOf('day')
		const toDate = dayjs(date).tz(this.TZ).endOf('date')
		return { sinceDate: sinceDate, toDate: toDate }
	}

	getSinceAndToUTCDate(granularity: PatientGranularity, date: Date): { sinceDate: Date; toDate: Date } {
		const { sinceDate, toDate } = this.getSinceAndToDayjs(granularity, date)
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}

	getDomainAndTicks(
		granularity: PatientGranularity,
		date: Date,
		firstData: VisualizationData | null
	): { domain: number[]; ticks: number[] } {
		const { sinceDate: since, toDate: to } = this.getSinceAndToDayjs(granularity, date)
		let domain = [since.utc().unix(), to.utc().unix()]
		let ticks: number[] = []
		switch (granularity) {
			case PatientGranularity.WEEK:
				const dayDiff = to.diff(since, 'day')
				ticks = Array.from<number>({ length: dayDiff + 1 }).map((_, i) => since.add(i, 'day').utc().unix())
				break

			case PatientGranularity.MONTH:
				const firstTickDate = since.add(3, 'day').startOf('day')
				const lastTickDate = to.subtract(3, 'day').startOf('day')
				ticks = Array.from<number>({ length: 4 }).fill(0)
				ticks[0] = firstTickDate.utc().unix()
				ticks[3] = lastTickDate.utc().unix()
				const diff = lastTickDate.diff(firstTickDate, 'day')
				const tickInterval = diff / 3
				ticks[1] = firstTickDate.add(tickInterval, 'day').utc().unix()
				ticks[2] = lastTickDate.subtract(tickInterval, 'day').utc().unix()
				break

			case PatientGranularity.DAY:
				ticks = Array.from<number>({ length: 6 }).fill(0)
				const firstResultBefore6AM = firstData ? firstData.label < since.set('hour', 6).utc().unix() : false
				const interval = firstResultBefore6AM ? 4 : 3
				for (
					let d = since.clone().set('hour', firstResultBefore6AM ? 2 : 6), i = 0;
					!d.isAfter(to);
					d = d.add(interval, 'hour'), i++
				) {
					ticks[i] = d.utc().unix()
				}
				domain = [ticks[0], ticks[5]]
		}
		return { domain, ticks }
	}

	getDoctorDomainAndTicks(from: dayjs.Dayjs, to: dayjs.Dayjs): { domain: number[]; ticks: number[] } {
		const domain = [from.tz(this.TZ).startOf('day').utc().unix(), to.tz(this.TZ).startOf('day').utc().unix()]
		const dayDiff = to.diff(from, 'day')
		const ticks = Array.from<number>({ length: dayDiff + 1 }).map((_, i) => from.add(i, 'day').utc().unix())
		return { domain, ticks }
	}
}
