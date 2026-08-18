import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { SalaryController } from './salary.controller';
import { SalaryService } from './salary.service';
import { Employee } from '../employee/entity/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [SalaryController],
  providers: [SalaryService, FormulaEngineService],
  exports: [SalaryService, TypeOrmModule],
})
export class SalaryModule {}
