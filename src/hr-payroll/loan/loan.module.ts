import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { Employee } from '../employee/entity/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [LoanController],
  providers: [LoanService, FormulaEngineService],
  exports: [LoanService, TypeOrmModule],
})
export class LoanModule {}
