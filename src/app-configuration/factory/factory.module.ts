import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from './entity/factory.entity';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';

@Module({
    imports: [TypeOrmModule.forFeature([Factory])],
    controllers: [FactoryController],
    providers: [FactoryService],
})
export class FactoryModule { }