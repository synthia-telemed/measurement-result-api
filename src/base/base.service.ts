import { Injectable } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { Granularity, PatientGranularity } from './model'
dayjs.extend(utc)

@Injectable()
export class BaseService {
	TZ = 'Asia/Bangkok'

	labelTimeParser(granularity: Granularity, dateTime: Date): number {
		switch (granularity) {
			case PatientGranularity.DAY:
				return dayjs(dateTime).utc().unix()
			default:
				return dayjs(dateTime).tz(this.TZ).startOf('day').utc().unix()
		}
	}

	protected getTodayDateRange(): { sinceDate: Date; toDate: Date } {
		const sinceDate = dayjs().tz(this.TZ).startOf('day')
		const toDate = sinceDate.endOf('day')
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}
}
