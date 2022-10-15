import { HttpException, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SentryInterceptor, SentryModule } from '@ntegral/nestjs-sentry'
import * as Joi from 'joi'
import { AppController } from './app.controller'
import { BloodPressureModule } from './blood-pressure/blood-pressure.module'
import { GlucoseModule } from './glucose/glucose.module'
import { APP_INTERCEPTOR } from '@nestjs/core'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: Joi.object({
				PORT: Joi.number().default(3000),
				MONGODB_CONNECTION_STRING: Joi.string().required(),
				SENTRY_DSN: Joi.string().optional(),
			}),
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('MONGODB_CONNECTION_STRING'),
			}),
			inject: [ConfigService],
		}),
		SentryModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				dsn: configService.get<string>('SENTRY_DSN'),
				environment: configService.get<string>('NODE_ENV'),
			}),
			inject: [ConfigService],
		}),
		BloodPressureModule,
		GlucoseModule,
	],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useFactory: () =>
				new SentryInterceptor({
					filters: [
						{
							type: HttpException,
							filter: (exception: HttpException) => 500 > exception.getStatus(), // Only report 500 errors
						},
					],
				}),
		},
	],
	controllers: [AppController],
})
export class AppModule {}
