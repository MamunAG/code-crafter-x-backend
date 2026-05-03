import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Files } from 'src/files/entities/file.entity';
import { Factory } from './entity/factory.entity';
import { FactoryController } from './factory.controller';
import { FactoryService } from './factory.service';

@Module({
    imports: [TypeOrmModule.forFeature([Factory, Files])],
    controllers: [FactoryController],
    providers: [FactoryService],
})
export class FactoryModule { }
