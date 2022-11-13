import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { HospitalModule } from 'src/hospital/hospital.module'
import { PrismaService } from 'src/prisma.service'
import { GlucoseController } from './glucose.controller'
import { GlucoseService } from './glucose.service'
import { Glucose, GlucoseSchema } from './schema/glucose.schema'

@Module({
	imports: [MongooseModule.forFeature([{ name: Glucose.name, schema: GlucoseSchema }]), HospitalModule],
	controllers: [GlucoseController],
	providers: [GlucoseService, PrismaService],
	exports: [GlucoseService],
})
export class GlucoseModule {}
