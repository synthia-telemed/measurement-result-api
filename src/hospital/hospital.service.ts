import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { gql, GraphQLClient } from 'graphql-request'

@Injectable()
export class HospitalService {
	private client: GraphQLClient
	constructor(private configService: ConfigService) {
		this.client = new GraphQLClient(this.configService.get<string>('HOSPITAL_SYSTEM_ENDPOINT'))
	}

	async getAppointment(appointmentID: string) {
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
		const vars = {
			where: { id: { equals: parseInt(appointmentID) } },
		}
		return await this.client.request(query, vars)
	}
}
