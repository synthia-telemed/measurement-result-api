import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone'
import { Granularity, VisualizationData } from './model'
dayjs.extend(timezone)

export class BaseController {
	TZ = 'Asia/Bangkok'
	getXLabel(granularity: Granularity, date: Date): string {
		switch (granularity) {
			case Granularity.DAY:
				return 'Time'
			default:
				const { sinceDate, toDate } = this.getSinceAndToDayjs(granularity, date)
				const dateFormat = 'DD MMM'
				return `${sinceDate.format(dateFormat)}-${toDate.format(dateFormat)}`
		}
	}

	getSinceAndToDayjs(granularity: Granularity, date: Date): { sinceDate: dayjs.Dayjs; toDate: dayjs.Dayjs } {
		const sinceDate = dayjs(date).tz(this.TZ).subtract(1, granularity).add(1, 'day').startOf('day')
		const toDate = dayjs(date).tz(this.TZ).endOf('date')
		return { sinceDate: sinceDate, toDate: toDate }
	}

	getSinceAndToUTCDate(granularity: Granularity, date: Date): { sinceDate: Date; toDate: Date } {
		const { sinceDate, toDate } = this.getSinceAndToDayjs(granularity, date)
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}

	getDomainAndTicks(
		granularity: Granularity,
		date: Date,
		firstData: VisualizationData
	): { domain: number[]; ticks: number[] } {
		const { sinceDate: since, toDate: to } = this.getSinceAndToDayjs(granularity, date)
		let domain = [since.utc().unix(), to.utc().unix()]
		let ticks: number[] = []
		switch (granularity) {
			case Granularity.WEEK:
				ticks = Array.from<number>({ length: 7 }).fill(0)
				for (let d = since.clone(), i = 0; !d.isAfter(to); d = d.add(1, 'day'), i++) {
					ticks[i] = d.startOf('day').utc().unix()
				}
				break

			case Granularity.MONTH:
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

			case Granularity.DAY:
				ticks = Array.from<number>({ length: 6 }).fill(0)
				const firstResultBefore6AM = firstData.label < since.set('hour', 6).utc().unix()
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
}
