import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GlucoseController } from './glucose.controller'
import { GlucoseService } from './glucose.service'
import { Glucose, GlucoseSchema } from './schema/glucose.schema'

@Module({
	imports: [MongooseModule.forFeature([{ name: Glucose.name, schema: GlucoseSchema }])],
	controllers: [GlucoseController],
	providers: [GlucoseService],
	exports: [GlucoseService],
})
export class GlucoseModule {}
