import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentController } from './department.controller';
import { Department } from './entity/department.entity';
import { DepartmentService } from './department.service';

@Module({
    imports: [TypeOrmModule.forFeature([Department])],
    controllers: [DepartmentController],
    providers: [DepartmentService],
    exports: [DepartmentService, TypeOrmModule],
})
export class DepartmentModule { }