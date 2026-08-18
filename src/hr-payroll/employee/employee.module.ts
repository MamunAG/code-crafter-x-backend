import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entity/employee.entity';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Department } from '../master-data/department/entity/department.entity';
import { Designation } from '../master-data/designation/entity/designation.entity';
import { Files } from 'src/files/entities/file.entity';
import { HR_PAYROLL_ENTITIES, HrAuditEvent, HrMasterData } from '../common/entity';
import { AuditModule } from '../audit/audit.module';
import { FormulaEngineService } from '../payroll/formula-engine.service';
import { EmployeeLifecycleController } from './employee-lifecycle.controller';
import { EmployeeLifecycleService } from './employee-lifecycle.service';

@Module({
    imports: [TypeOrmModule.forFeature([Employee, Factory, Department, Designation, Files, HrAuditEvent, HrMasterData, ...HR_PAYROLL_ENTITIES]), AuditModule],
    controllers: [EmployeeController, EmployeeLifecycleController],
    providers: [EmployeeService, EmployeeLifecycleService, FormulaEngineService],
    exports: [EmployeeService, EmployeeLifecycleService, TypeOrmModule],
})
export class EmployeeModule { }
