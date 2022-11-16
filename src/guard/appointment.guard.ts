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
		const [doctorRefID, appointment] = await Promise.all([
			this.getDoctorRefID(parseInt(doctorID)),
			this.hospitalService.getAppointment(appointmentID),
		])
		if (!appointment || !doctorRefID) throw new NotFoundException()

		const isSameDoctor = doctorRefID == appointment['doctorId'] // && dayjs.utc().tz(this.tz).isSame(dayjs.utc(appointment['startDateTime']).tz(this.tz), 'day')
		if (!isSameDoctor) return false

		const patientID = await this.getPatientID(appointment['patientId'])
		if (!patientID) return false
		req.patientID = patientID
		return true
	}

	private async getDoctorRefID(doctorID: number): Promise<string | null> {
		const doctor = await this.prisma.doctors.findFirst({ where: { id: doctorID } })
		return doctor?.ref_id ?? null
	}

	private async getPatientID(refID: string) {
		const patient = await this.prisma.patients.findFirst({ where: { ref_id: refID } })
		return patient?.id ?? null
	}
}
