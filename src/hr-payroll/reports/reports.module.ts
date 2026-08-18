import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { Employee } from '../employee/entity/employee.entity';
import { HrReportService } from './report.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ...HR_PAYROLL_ENTITIES])],
  controllers: [ReportsController],
  providers: [HrReportService],
  exports: [HrReportService],
})
export class ReportsModule {}
