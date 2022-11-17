import { Injectable } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
dayjs.extend(utc)

@Injectable()
export class BaseService {
	TZ = 'Asia/Bangkok'

	labelTimeParser(isAggregate: boolean, dateTime: Date): number {
		const date = dayjs(dateTime).tz(this.TZ)
		if (isAggregate) return date.startOf('day').utc().unix()
		return date.utc().unix()
	}

	protected getTodayDateRange(): { sinceDate: Date; toDate: Date } {
		const sinceDate = dayjs().tz(this.TZ).startOf('day')
		const toDate = sinceDate.endOf('day')
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}
}
