import { Injectable, CanActivate, ExecutionContext, NotFoundException } from '@nestjs/common'
import { HospitalService } from 'src/hospital/hospital.service'
import { PrismaService } from 'src/prisma.service'
import * as dayjs from 'dayjs'
import * as utc from 'dayjs/plugin/utc'
import * as timezone from 'dayjs/plugin/utc'
dayjs.extend(utc)
dayjs.extend(timezone)

@Injectable()
export class DoctorAppointmentGuard implements CanActivate {
	private tz = 'Asia/Bangkok'
	constructor(private prisma: PrismaService, private hospitalService: HospitalService) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest()
		const doctorID = req.headers['x-user-id']
		const { appointmentID } = req.params
		const [doctorRefID, result] = await Promise.all([
			this.getDoctorRefID(parseInt(doctorID)),
			this.hospitalService.getAppointment(appointmentID),
		])
		const appointment = result?.appointment
		if (!appointment || !doctorRefID) throw new NotFoundException()

		return (
			doctorRefID == appointment['doctorId'] &&
			dayjs.utc().tz(this.tz).isSame(dayjs.utc(appointment['startDateTime']).tz(this.tz), 'day')
		)
	}

	private async getDoctorRefID(doctorID: number): Promise<string | null> {
		const doctor = await this.prisma.doctors.findFirst({ where: { id: doctorID } })
		return doctor?.ref_id ?? null
	}
}
