import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { Granularity } from './model'
dayjs.extend(utc)

export class BaseService {
	TZ = 'Asia/Bangkok'

	labelTimeParser(granularity: Granularity, dateTime: Date): number {
		if (granularity === Granularity.DAY) {
			return dayjs(dateTime).utc().unix()
		}
		return dayjs(dateTime).tz(this.TZ).startOf('day').utc().unix()
	}

	protected getTodayDateRange(): { sinceDate: Date; toDate: Date } {
		const sinceDate = dayjs().tz(this.TZ).startOf('day')
		const toDate = sinceDate.endOf('day')
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}
}
