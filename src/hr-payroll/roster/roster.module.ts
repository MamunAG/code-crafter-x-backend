import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { AuditModule } from '../audit/audit.module';
import { HR_PAYROLL_ENTITIES } from '../common/entity';
import { Employee } from '../employee/entity/employee.entity';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { RosterController } from './roster.controller';
import { RosterService } from './roster.service';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Factory, ...HR_PAYROLL_ENTITIES]), AuditModule],
  controllers: [RosterController],
  providers: [RosterService, FormulaEngineService],
  exports: [RosterService, TypeOrmModule],
})
export class RosterModule {}
