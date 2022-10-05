import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserRole } from './roles.decorator'

export interface UserInfo {
	id: number
	role: UserRole
}

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext): UserInfo => {
	const req = ctx.switchToHttp().getRequest()

	const id = parseInt(req.headers['x-user-id'] as string)
	if (id.toString() === 'NaN') throw new BadRequestException('Invalid user id')

	return { id, role: req.role }
})
