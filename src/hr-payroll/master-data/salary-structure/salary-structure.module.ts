import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../../common/entity';
import { FormulaEngineService } from '../../payroll/formula-engine.service';
import { SalaryStructureController } from './salary-structure.controller';
import { SalaryStructureService } from './salary-structure.service';
import { Employee } from '../../employee/entity/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [SalaryStructureController],
  providers: [SalaryStructureService, FormulaEngineService],
  exports: [SalaryStructureService, TypeOrmModule],
})
export class SalaryStructureModule {}
