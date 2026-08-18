import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Employee } from '../employee/entity/employee.entity';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { AuditModule } from '../audit/audit.module';
import { AttendanceController } from './attendance.controller';
import { AttendanceIntegrationController } from './attendance-integration.controller';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Factory, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [AttendanceController, AttendanceIntegrationController],
  providers: [AttendanceService, FormulaEngineService],
  exports: [AttendanceService, TypeOrmModule],
})
export class AttendanceModule {}
