import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entity/employee.entity';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Department } from '../master-data/department/entity/department.entity';
import { Designation } from '../master-data/designation/entity/designation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Employee, Factory, Department, Designation])],
    controllers: [EmployeeController],
    providers: [EmployeeService],
})
export class EmployeeModule { }