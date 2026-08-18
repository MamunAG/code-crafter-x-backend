import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/role.enum';
import { DataSource } from 'typeorm';

@ApiTags('Health')
@Controller('api/v1/hr/health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}
  @Public() @Get() health() { return { status: 'ok', timestamp: new Date().toISOString() }; }
  @Public() @Get('ready') async ready() { await this.dataSource.query('SELECT 1'); return { status: 'ready', database: 'available', timestamp: new Date().toISOString() }; }
  @Roles(RolesEnum.admin) @Get('metrics') async metrics() {
    const [jobs, payroll] = await Promise.all([
      this.dataSource.query<Array<{ status: string; count: number; stalled: number }>>(`SELECT status, COUNT(*)::int AS count, COUNT(*) FILTER (WHERE status = 'RUNNING' AND lease_expires_at < now())::int AS stalled FROM hr_jobs GROUP BY status`),
      this.dataSource.query<Array<{ status: string; count: number }>>(`SELECT status, COUNT(*)::int AS count FROM hr_payroll_runs GROUP BY status`),
    ]);
    return { jobs, payroll, timestamp: new Date().toISOString() };
  }
}
