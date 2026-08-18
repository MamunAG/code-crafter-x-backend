import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as XLSX from 'xlsx';
import { Repository } from 'typeorm';
import { HrJob } from '../common/entity';
import { HrJobStatus } from '../common/hr.enums';

export const JOB_TYPE_HR_IMPORT = 'HR_IMPORT';
export const HR_IMPORT_TYPES = ['employee-details', 'leave-balances', 'loans', 'salary-assignments', 'payroll-ytd'] as const;

@Injectable()
export class HrImportService {
  constructor(@InjectRepository(HrJob) private readonly jobs: Repository<HrJob>) {}

  async queue(organizationId: string, userId: string, type: string, file?: Express.Multer.File) {
    if (!HR_IMPORT_TYPES.includes(type as typeof HR_IMPORT_TYPES[number])) throw new BadRequestException(`Import type must be one of: ${HR_IMPORT_TYPES.join(', ')}.`);
    if (!file?.buffer?.length) throw new BadRequestException('Import file is required.');
    const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: false });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false });
    if (!rows.length) throw new BadRequestException('Import file contains no data rows.');
    if (rows.length > 10000) throw new BadRequestException('One import cannot exceed 10,000 rows.');
    return this.jobs.save(this.jobs.create({
      organizationId, type: JOB_TYPE_HR_IMPORT, status: HrJobStatus.Queued,
      payload: { importType: type, requestedById: userId, filename: file.originalname, rows },
      result: { totalRows: rows.length, inserted: 0, updated: 0, failed: 0, errors: [] },
    }));
  }

  status(organizationId: string, id: string) { return this.jobs.findOne({ where: { id, organizationId, type: JOB_TYPE_HR_IMPORT } }); }
}
