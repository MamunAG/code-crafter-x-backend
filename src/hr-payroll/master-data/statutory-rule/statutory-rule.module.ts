import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../../common/entity';
import { FormulaEngineService } from '../../payroll/formula-engine.service';
import { StatutoryRuleController } from './statutory-rule.controller';
import { StatutoryRuleService } from './statutory-rule.service';
import { Employee } from '../../employee/entity/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [StatutoryRuleController],
  providers: [StatutoryRuleService, FormulaEngineService],
  exports: [StatutoryRuleService, TypeOrmModule],
})
export class StatutoryRuleModule {}
