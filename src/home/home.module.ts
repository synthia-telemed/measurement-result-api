import { Module } from '@nestjs/common'
import { BloodPressureModule } from 'src/blood-pressure/blood-pressure.module'
import { GlucoseModule } from 'src/glucose/glucose.module'
import { HomeController } from './home.controller'

@Module({
	imports: [BloodPressureModule, GlucoseModule],
	controllers: [HomeController],
})
export class HomeModule {}
