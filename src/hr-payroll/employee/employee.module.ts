import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { Employee } from './entity/employee.entity';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { Department } from '../master-data/department/entity/department.entity';
import { Designation } from '../master-data/designation/entity/designation.entity';
import { Files } from 'src/files/entities/file.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Employee, Factory, Department, Designation, Files])],
    controllers: [EmployeeController],
    providers: [EmployeeService],
})
export class EmployeeModule { }
