import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { AuditModule } from '../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { Employee } from '../employee/entity/employee.entity';
import { BangladeshPayrollPolicyService } from './bangladesh-payroll-policy.service';
import { FormulaEngineService } from './formula-engine.service';
import { PayrollController } from './payroll.controller';
import { PayrollService, PayrollWorkerService } from './payroll.service';
import { PayrollWorkflowService } from './payroll-workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Factory, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [PayrollController],
  providers: [FormulaEngineService, BangladeshPayrollPolicyService, PayrollWorkflowService, PayrollService, PayrollWorkerService],
  exports: [PayrollService, PayrollWorkerService, FormulaEngineService, BangladeshPayrollPolicyService, TypeOrmModule],
})
export class PayrollModule {}
