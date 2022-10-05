import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common'

export enum UserRole {
	PATIENT = 'patient',
	DOCTOR = 'doctor',
}

export interface UserInfo {
	id: number
	role: UserRole
}

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserInfo => {
	const req = ctx.switchToHttp().getRequest()

	const id = parseInt(req.headers['x-user-id'] as string)
	if (id.toString() === 'NaN') throw new BadRequestException('Invalid user id')

	let role: UserRole
	switch ((req.headers['x-user-role'] as string).toLowerCase()) {
		case UserRole.PATIENT:
			role = UserRole.PATIENT
			break
		case UserRole.DOCTOR:
			role = UserRole.DOCTOR
			break
		default:
			throw new BadRequestException('Invalid user role')
	}
	return { id, role }
})
