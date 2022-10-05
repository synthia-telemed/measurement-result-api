import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from 'src/decorator/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}

	canActivate(ctx: ExecutionContext): boolean {
		const roles = this.reflector.get<UserRole[]>('roles', ctx.getHandler())
		if (!roles) {
			return true
		}

		const req = ctx.switchToHttp().getRequest()
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

		if (!roles.find(r => r === role)) return false

		req.role = role
		return true
	}
}
