import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrMasterData } from '../../common/entity';
import { MasterDataController } from './master-data.controller';
import { MasterDataService } from './master-data.service';
import { AuditModule } from '../../audit/audit.module';
import { CATEGORY_MASTER_DATA_CONTROLLERS } from './category-master-data.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HrMasterData]), AuditModule],
  controllers: [...CATEGORY_MASTER_DATA_CONTROLLERS, MasterDataController],
  providers: [MasterDataService],
  exports: [MasterDataService, TypeOrmModule],
})
export class MasterDataModule {}
