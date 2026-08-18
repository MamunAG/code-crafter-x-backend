import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { AuditModule } from '../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { Employee } from '../employee/entity/employee.entity';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Factory, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [LeaveController],
  providers: [LeaveService, FormulaEngineService],
  exports: [LeaveService, TypeOrmModule],
})
export class LeaveModule {}
