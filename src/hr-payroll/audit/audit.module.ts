import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrAuditEvent } from '../common/entity';
import { AuditService } from './audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([HrAuditEvent])],
  providers: [AuditService],
  exports: [AuditService, TypeOrmModule],
})
export class AuditModule {}
