import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignationController } from './designation.controller';
import { DesignationService } from './designation.service';
import { Designation } from './entity/designation.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Designation])],
    controllers: [DesignationController],
    providers: [DesignationService],
    exports: [DesignationService, TypeOrmModule],
})
export class DesignationModule { }