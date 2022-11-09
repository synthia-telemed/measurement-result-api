import * as dayjs from 'dayjs'
import * as timezone from 'dayjs/plugin/timezone'
import { Granularity } from 'src/blood-pressure/dto/patient-visualization-request.dto'
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
}
