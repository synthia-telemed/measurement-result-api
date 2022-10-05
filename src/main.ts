import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { RolesGuard } from './guard/roles.guard'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const configService = app.get(ConfigService)
	app.useGlobalPipes(new ValidationPipe())
	app.useGlobalGuards(new RolesGuard(new Reflector()))
	app.setGlobalPrefix('api')
	await app.listen(configService.get('PORT'))
}
bootstrap()
