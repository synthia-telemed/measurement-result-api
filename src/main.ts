import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory, Reflector } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { RolesGuard } from './guard/roles.guard'
import { PrismaService } from './prisma.service'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	const configService = app.get(ConfigService)
	app.setGlobalPrefix('/api')
	app.useGlobalPipes(new ValidationPipe())
	app.useGlobalGuards(new RolesGuard(new Reflector()))
	const prismaService = app.get(PrismaService)
	await prismaService.enableShutdownHooks(app)

	const config = new DocumentBuilder()
		.setTitle('Synthia Measurement Result API')
		.addBearerAuth()
		.addServer('/measurement', 'Production')
		.addServer('/', 'Local Development')
		.build()
	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('api/docs', app, document)
	await app.listen(configService.get('PORT'))
}
bootstrap()
