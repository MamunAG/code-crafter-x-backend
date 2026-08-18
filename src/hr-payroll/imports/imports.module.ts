import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrJob } from '../common/entity';
import { HrImportService } from './import.service';
import { ImportsController } from './imports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HrJob])],
  controllers: [ImportsController],
  providers: [HrImportService],
  exports: [HrImportService],
})
export class ImportsModule {}
