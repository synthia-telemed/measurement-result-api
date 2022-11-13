import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { gql, GraphQLClient } from 'graphql-request'
import Redis from 'ioredis'

@Injectable()
export class HospitalService {
	private client: GraphQLClient
	private readonly redis: Redis
	constructor(private configService: ConfigService) {
		this.client = new GraphQLClient(this.configService.get<string>('HOSPITAL_SYSTEM_ENDPOINT'))
		this.redis = new Redis({
			host: this.configService.get('REDIS_HOST'),
			port: this.configService.get('REDIS_PORT'),
			username: this.configService.get('REDIS_USERNAME'),
			password: this.configService.get('REDIS_PASSWORD'),
		})
	}

	async getAppointment(appointmentID: string) {
		const cacheKey = `measurement-server:appointment:${appointmentID}`
		const cachedAppointment = await this.redis.get(cacheKey)
		if (cachedAppointment) return JSON.parse(cachedAppointment)
		const query = gql`
			query getAppointment($where: AppointmentWhereInput!) {
				appointment(where: $where) {
					id
					patientId
					doctorId
					startDateTime
					endDateTime
					status
				}
			}
		`
		const vars = { where: { id: { equals: parseInt(appointmentID) } } }
		const { appointment } = await this.client.request(query, vars)
		await this.redis.set(cacheKey, JSON.stringify(appointment), 'EX', 60 * 60 * 24)
		return appointment
	}

	async getPatientBirthDate(patientID: string) {
		const cacheKey = `measurement-server:patient:${patientID}`
		const cachedBirthDate = await this.redis.get(cacheKey)
		if (cachedBirthDate) return JSON.parse(cachedBirthDate)
		const query = gql`
			query Patient($where: PatientWhereInput!) {
				patient(where: $where) {
					birthDate
				}
			}
		`
		const vars = { where: { id: { equals: patientID } } }
		const { patient } = await this.client.request(query, vars)
		await this.redis.set(cacheKey, JSON.stringify(patient), 'EX', 60 * 60 * 24)
		return patient
	}
}
