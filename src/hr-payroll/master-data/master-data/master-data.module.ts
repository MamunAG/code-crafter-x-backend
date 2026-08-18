import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrMasterData } from '../../common/entity';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([HrMasterData]), AuditModule],
  controllers: [MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService, TypeOrmModule],
})
export class MasterDataModule {}
