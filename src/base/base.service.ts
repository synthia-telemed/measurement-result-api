import { Injectable } from '@nestjs/common'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import { Granularity, PatientGranularity } from './model'
dayjs.extend(utc)

@Injectable()
export class BaseService {
	TZ = 'Asia/Bangkok'

	labelTimeParser(granularity: Granularity, dateTime: Date): number {
		const date = dayjs(dateTime).tz(this.TZ)
		switch (granularity) {
			case PatientGranularity.DAY:
				return date.utc().unix()
			default:
				return date.startOf('day').utc().unix()
		}
	}

	aggregatedLabelTimeParser(dateTime: Date): number {
		return dayjs(dateTime).tz(this.TZ).startOf('day').utc().unix()
	}

	protected getTodayDateRange(): { sinceDate: Date; toDate: Date } {
		const sinceDate = dayjs().tz(this.TZ).startOf('day')
		const toDate = sinceDate.endOf('day')
		return { sinceDate: sinceDate.utc().toDate(), toDate: toDate.utc().toDate() }
	}
}
