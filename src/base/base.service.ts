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
		return dayjs(dateTime).startOf('day').utc().unix()
	}
}
