import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule, ConfigService } from '@nestjs/config'
import * as Joi from 'joi'
import { AppController } from './app.controller'
import { BloodPressureModule } from './blood-pressure/blood-pressure.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: Joi.object({
				PORT: Joi.number().default(3000),
				MONGODB_CONNECTION_STRING: Joi.string().required(),
			}),
		}),
		MongooseModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get<string>('MONGODB_CONNECTION_STRING'),
			}),
			inject: [ConfigService],
		}),
		BloodPressureModule,
	],
	controllers: [AppController],
})
export class AppModule {}
