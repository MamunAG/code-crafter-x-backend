import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAuditEvent } from '../common/entity';
import {
  AuditController,
  IamAuditController,
  MerchandisingAuditController,
  SharedAuditController,
} from './audit.controller';
import { AuditCronService } from './audit-cron.service';
import { AuditRetentionService } from './audit-retention.service';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([HrAuditEvent])],
  controllers: [
    SharedAuditController,
    AuditController,
    MerchandisingAuditController,
    IamAuditController,
  ],
  providers: [AuditService, AuditCronService, AuditRetentionService],
  exports: [AuditService, AuditCronService, TypeOrmModule],
})
export class AuditModule {}
