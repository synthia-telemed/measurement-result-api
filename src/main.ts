import { ValidationPipe } from '@nestjs/common'
import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { RolesGuard } from './guard/roles.guard'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.useGlobalPipes(new ValidationPipe())
	app.useGlobalGuards(new RolesGuard(new Reflector()))
	app.setGlobalPrefix('api')
	await app.listen(3000)
}
bootstrap()
