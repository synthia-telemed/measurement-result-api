import { Body, Controller, Post } from '@nestjs/common'
import {
	ApiBadRequestResponse,
	ApiBearerAuth,
	ApiCreatedResponse,
	ApiInternalServerErrorResponse,
	ApiOperation,
	ApiTags,
	ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Roles, UserRole } from 'src/decorator/roles.decorator'
import { User, UserInfo } from 'src/decorator/user.decorstor'
import { CreateGlucoseDto } from './dto/create-glucose.dto'
import { GlucoseService } from './glucose.service'
import { Glucose } from './schema/glucose.schema'

@Controller('glucose')
@ApiTags('Glucose')
export class GlucoseController {
	constructor(private glucoseService: GlucoseService) {}

	@Post()
	@Roles(UserRole.PATIENT)
	@ApiOperation({ summary: 'Record glucose' })
	@ApiTags('Patient')
	@ApiBearerAuth()
	@ApiCreatedResponse({ type: Glucose })
	@ApiBadRequestResponse({ description: 'Invalid data' })
	@ApiUnauthorizedResponse({ description: 'Unauthorized' })
	@ApiInternalServerErrorResponse({ description: 'Internal server error' })
	async createGlucose(@User() { id }: UserInfo, @Body() data: CreateGlucoseDto): Promise<Glucose> {
		return this.glucoseService.create(data, id)
	}
}
