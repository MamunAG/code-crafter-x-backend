import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAuditEvent } from '../common/entity';
import { AuditController } from './audit.controller';
import { AuditCronService } from './audit-cron.service';
import { AuditRetentionService } from './audit-retention.service';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([HrAuditEvent])],
  controllers: [AuditController],
  providers: [AuditService, AuditCronService, AuditRetentionService],
  exports: [AuditService, AuditCronService, TypeOrmModule],
})
export class AuditModule {}
