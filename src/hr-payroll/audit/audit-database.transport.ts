import { DataSource } from 'typeorm';
import Transport from 'winston-transport';
import { AuditEvent } from './entity/audit-event.entity';
import type { AuditEventInput } from './audit.types';

type AuditLogInfo = {
  auditEvent?: AuditEventInput;
  [key: string]: unknown;
};

export class AuditDatabaseTransport extends Transport {
  constructor(private readonly dataSource: DataSource) {
    super({ level: 'info' });
  }

  log(info: AuditLogInfo, callback: () => void) {
    setImmediate(() => this.emit('logged', info));
    if (!info.auditEvent || !this.dataSource.isInitialized) {
      callback();
      return;
    }
    void this.persist(info.auditEvent)
      .then(() => callback())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(
          `${JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            context: AuditDatabaseTransport.name,
            message: `Audit database transport failed: ${message}`,
          })}\n`,
        );
        callback();
      });
  }

  private async persist(event: AuditEventInput) {
    const actorName =
      event.actorName ?? (await this.actorName(event.actorId ?? null));
    const repository = this.dataSource.getRepository(AuditEvent);
    await repository.save(repository.create({ ...event, actorName }));
  }

  private async actorName(actorId: string | null) {
    if (!actorId) return null;
    const rows = await this.dataSource.query<Array<{ actorName?: string }>>(
      `SELECT COALESCE(NULLIF(TRIM("name"), ''), "email") AS "actorName" FROM "users" WHERE "id" = $1 LIMIT 1`,
      [actorId],
    );
    return rows[0]?.actorName ?? null;
  }
}
