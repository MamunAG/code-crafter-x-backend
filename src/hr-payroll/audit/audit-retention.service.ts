import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AuditService } from './audit.service';
import { AuditEvent } from './entity/audit-event.entity';
import { AuditCategory, AuditModuleName, AuditStatus } from './audit.types';

@Injectable()
export class AuditRetentionService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly events: Repository<AuditEvent>,
    private readonly audit: AuditService,
  ) {}

  @Cron('0 30 2 * * *', { name: 'audit-retention-cleanup' })
  async removeExpired() {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let deleted = 0;
    while (true) {
      const batch = await this.events.find({
        select: { id: true },
        where: { createdAt: LessThan(cutoff) },
        order: { createdAt: 'ASC' },
        take: 5000,
      });
      if (!batch.length) break;
      const result = await this.events.delete(batch.map((event) => event.id));
      deleted += result.affected ?? 0;
      if (batch.length < 5000) break;
    }
    await this.audit.recordEvent({
      moduleName: AuditModuleName.System,
      category: AuditCategory.Cron,
      status: AuditStatus.Success,
      action: 'AUDIT_RETENTION_CLEANUP',
      subjectType: 'AuditEvent',
      subjectId: cutoff.toISOString(),
      actorName: 'System scheduler',
      metadata: { retentionDays: 90, deleted, cutoff: cutoff.toISOString() },
    });
    return { deleted, cutoff };
  }
}
