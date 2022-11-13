import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { BloodPressureController } from './blood-pressure.controller'
import { BloodPressure, BloodPressureSchema } from './schema/blood-pressure.schema'
import { BloodPressureService } from './blood-pressure.service'
import { HospitalModule } from 'src/hospital/hospital.module'
import { PulseController } from './pulse.controller'
import { PulseService } from './pulse.service'
import { PrismaService } from 'src/prisma.service'

@Module({
	imports: [MongooseModule.forFeature([{ name: BloodPressure.name, schema: BloodPressureSchema }]), HospitalModule],
	controllers: [BloodPressureController, PulseController],
	providers: [BloodPressureService, PulseService, PrismaService],
	exports: [BloodPressureService, PulseService],
})
export class BloodPressureModule {}
