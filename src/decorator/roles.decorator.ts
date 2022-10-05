import { SetMetadata } from '@nestjs/common'

export enum UserRole {
	PATIENT = 'patient',
	DOCTOR = 'doctor',
}

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles)
