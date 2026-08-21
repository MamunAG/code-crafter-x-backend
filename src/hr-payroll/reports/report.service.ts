import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { In, Repository } from 'typeorm';
import { AttendanceDay, EmployeeLoan, LeaveRequest, PayrollEmployee, PayrollLine, PayrollRun } from '../common/entity';
import { PayrollRunStatus } from '../common/hr.enums';
import { ReportQueryDto } from '../common/dto';
import { Employee } from '../employee/entity/employee.entity';
import { EmployeeSalaryAssignment } from '../common/entity';

export type GeneratedReport = { buffer: Buffer; contentType: string; filename: string };
type PaginatedReport = { items: Array<Record<string, unknown>>; meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean } };

@Injectable()
export class HrReportService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AttendanceDay) private readonly attendance: Repository<AttendanceDay>,
    @InjectRepository(LeaveRequest) private readonly leaves: Repository<LeaveRequest>,
    @InjectRepository(EmployeeLoan) private readonly loans: Repository<EmployeeLoan>,
    @InjectRepository(PayrollRun) private readonly runs: Repository<PayrollRun>,
    @InjectRepository(PayrollEmployee) private readonly payrollEmployees: Repository<PayrollEmployee>,
    @InjectRepository(PayrollLine) private readonly payrollLines: Repository<PayrollLine>,
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    @InjectRepository(EmployeeSalaryAssignment) private readonly salaryAssignments: Repository<EmployeeSalaryAssignment>,
  ) {}

  async report(organizationId: string, type: string, query: ReportQueryDto): Promise<PaginatedReport | GeneratedReport> {
    const rows = await this.getRows(organizationId, type, query);
    if ((query.format ?? 'json') === 'json') {
      const page = query.page ?? 1; const limit = query.limit ?? 20; const items = rows.slice((page - 1) * limit, page * limit); const totalPages = Math.ceil(rows.length / limit);
      return { items, meta: { total: rows.length, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } };
    }
    if (query.format === 'xlsx') return this.xlsx(rows, `hr-${type}`);
    return this.pdfTable(rows, `HR ${type.replace(/-/g, ' ')}`, query.language ?? 'en');
  }

  async payslip(organizationId: string, payrollEmployeeId: string, language: 'en' | 'bn' = 'en') {
    const payroll = await this.payrollEmployees.createQueryBuilder('payroll').innerJoinAndSelect('payroll.payrollRun', 'run')
      .where('payroll.id = :payrollEmployeeId AND run.organization_id = :organizationId', { payrollEmployeeId, organizationId }).getOne();
    if (!payroll) throw new NotFoundException('Payslip not found.');
    if (payroll.payrollRun.status !== PayrollRunStatus.Locked) throw new BadRequestException('Payslips can only be generated for locked payroll.');
    const lines = await this.payrollLines.find({ where: { payrollEmployeeId }, order: { componentCode: 'ASC' } });
    return this.payslipPdf(payroll, lines, language);
  }

  async bulkPayslips(organizationId: string, runId: string, language: 'en' | 'bn' = 'en') {
    const run = await this.runs.findOne({ where: { id: runId, organizationId } });
    if (!run) throw new NotFoundException('Payroll run not found.');
    if (run.status !== PayrollRunStatus.Locked) throw new BadRequestException('Payslips can only be generated for locked payroll.');
    const employees = await this.payrollEmployees.find({ where: { payrollRunId: runId }, order: { employeeId: 'ASC' } });
    const ids = employees.map((item) => item.id); const lines = ids.length ? await this.payrollLines.find({ where: { payrollEmployeeId: In(ids) } }) : [];
    return this.createPdf(language === 'bn' ? 'বেতন বিবরণী' : 'Bulk payslips', (document) => {
      employees.forEach((payroll, index) => {
        if (index) document.addPage(); document.fontSize(14).text(language === 'bn' ? 'বেতন বিবরণী' : 'Payslip', { align: 'center' }).moveDown();
        document.fontSize(10).text(`${language === 'bn' ? 'কর্মচারী' : 'Employee'}: ${this.displayValue(payroll.employeeSnapshot.employeeName)}`);
        for (const line of lines.filter((item) => item.payrollEmployeeId === payroll.id)) document.text(`${language === 'bn' ? line.componentNameBn ?? line.componentName : line.componentName}: ${line.amount}`);
        document.moveDown().text(`${language === 'bn' ? 'নিট বেতন' : 'Net pay'}: ${payroll.netAmount}`);
      });
    }, `payslips-${runId}.pdf`, language);
  }

  private async getRows(organizationId: string, type: string, query: ReportQueryDto): Promise<Array<Record<string, unknown>>> {
    switch (type) {
      case 'attendance': {
        const qb = this.attendance.createQueryBuilder('day').where('day.organization_id = :organizationId', { organizationId }).orderBy('day.work_date', 'ASC');
        if (query.dateFrom) qb.andWhere('day.work_date >= :dateFrom', query);
        if (query.dateTo) qb.andWhere('day.work_date <= :dateTo', query);
        if (query.employeeId) qb.andWhere('day.employee_id = :employeeId', query);
        return (await qb.getMany()).map((item) => ({ employeeId: item.employeeId, workDate: item.workDate, status: item.status, workedMinutes: item.workedMinutes, lateMinutes: item.lateMinutes, overtimeMinutes: item.overtimeMinutes }));
      }
      case 'overtime': {
        const qb = this.attendance.createQueryBuilder('day').where('day.organization_id = :organizationId AND day.overtime_minutes > 0', { organizationId });
        if (query.dateFrom) qb.andWhere('day.work_date >= :dateFrom', query); if (query.dateTo) qb.andWhere('day.work_date <= :dateTo', query);
        return (await qb.getMany()).map((item) => ({ employeeId: item.employeeId, workDate: item.workDate, overtimeMinutes: item.overtimeMinutes }));
      }
      case 'headcount': {
        const rows = await this.employees.createQueryBuilder('employee').select("CASE WHEN employee.is_active = true THEN 'ACTIVE' ELSE 'INACTIVE' END", 'status').addSelect('COUNT(*)', 'count')
          .where('employee.organization_id = :organizationId AND employee.deleted_at IS NULL', { organizationId }).groupBy('employee.is_active').getRawMany<{ status: string; count: string }>();
        return rows;
      }
      case 'salary-history': {
        const qb = this.salaryAssignments.createQueryBuilder('assignment').where('assignment.organization_id = :organizationId', { organizationId }).orderBy('assignment.effective_from', 'DESC');
        if (query.employeeId) qb.andWhere('assignment.employee_id = :employeeId', query);
        return (await qb.getMany()).map((item) => ({ employeeId: item.employeeId, structureId: item.salaryStructureId, effectiveFrom: item.effectiveFrom, effectiveTo: item.effectiveTo ?? '', baseAmount: item.baseAmount, currency: item.currency }));
      }
      case 'leave': return (await this.leaves.find({ where: { organizationId }, order: { startDate: 'ASC' } })).map((item) => ({ employeeId: item.employeeId, startDate: item.startDate, endDate: item.endDate, days: item.days, status: item.status }));
      case 'loans': return (await this.loans.find({ where: { organizationId }, order: { startDate: 'ASC' } })).map((item) => ({ employeeId: item.employeeId, loanNumber: item.loanNumber, principal: item.principal, outstanding: item.outstandingAmount, status: item.status }));
      case 'payroll-register': {
        const qb = this.payrollEmployees.createQueryBuilder('payroll').innerJoin('payroll.payrollRun', 'run').where('run.organization_id = :organizationId', { organizationId }).orderBy("payroll.employee_snapshot->>'employeeCode'", 'ASC');
        if (query.dateFrom) qb.andWhere('run.period_end >= :dateFrom', query);
        if (query.dateTo) qb.andWhere('run.period_start <= :dateTo', query);
        if (query.factoryId) qb.andWhere('run.factory_id = :factoryId', query);
        return (await qb.getMany()).map((item) => ({ employeeCode: item.employeeSnapshot.employeeCode, employeeName: item.employeeSnapshot.employeeName, gross: item.grossAmount, deductions: item.deductionAmount, net: item.netAmount, error: item.error ?? '' }));
      }
      case 'payroll-variance': {
        const runs = await this.runs.find({ where: { organizationId }, order: { periodEnd: 'DESC' }, take: 2 });
        if (runs.length < 2) return [];
        const values = await this.payrollEmployees.find({ where: { payrollRunId: In(runs.map((run) => run.id)) } });
        const current = values.filter((item) => item.payrollRunId === runs[0].id);
        const previous = new Map(values.filter((item) => item.payrollRunId === runs[1].id).map((item) => [item.employeeId, item]));
        return current.map((item) => ({ employeeCode: item.employeeSnapshot.employeeCode, employeeName: item.employeeSnapshot.employeeName, currentNet: item.netAmount, previousNet: previous.get(item.employeeId)?.netAmount ?? '0', variance: (Number(item.netAmount) - Number(previous.get(item.employeeId)?.netAmount ?? 0)).toFixed(4) }));
      }
      case 'deductions': return this.componentReport(organizationId, query, "line.type = 'DEDUCTION'");
      case 'tax': return this.componentReport(organizationId, query, "line.component_code ILIKE '%TAX%'");
      case 'provident-fund': return this.componentReport(organizationId, query, "line.component_code ILIKE '%PF%' OR line.component_code ILIKE '%PROVIDENT%'");
      case 'gratuity': return this.componentReport(organizationId, query, "line.component_code ILIKE '%GRATUITY%'");
      case 'final-settlements': {
        const qb = this.payrollEmployees.createQueryBuilder('payroll').innerJoin('payroll.payrollRun', 'run').where("run.organization_id = :organizationId AND run.run_type = 'FINAL_SETTLEMENT'", { organizationId });
        return (await qb.getMany()).map((item) => ({ employeeCode: item.employeeSnapshot.employeeCode, employeeName: item.employeeSnapshot.employeeName, gross: item.grossAmount, deductions: item.deductionAmount, net: item.netAmount }));
      }
      default: throw new BadRequestException('Unsupported HR report type.');
    }
  }

  private async componentReport(organizationId: string, query: ReportQueryDto, predicate: string) {
    const qb = this.payrollLines.createQueryBuilder('line').innerJoin('line.payrollEmployee', 'payroll').innerJoin('payroll.payrollRun', 'run')
      .where('run.organization_id = :organizationId', { organizationId }).andWhere(predicate).orderBy('line.component_code', 'ASC');
    if (query.dateFrom) qb.andWhere('run.period_end >= :dateFrom', query); if (query.dateTo) qb.andWhere('run.period_start <= :dateTo', query);
    const rows = await qb.select('line.component_code', 'componentCode').addSelect('line.component_name', 'componentName').addSelect('line.amount', 'amount')
      .addSelect("payroll.employee_snapshot->>'employeeCode'", 'employeeCode').addSelect('run.period_start', 'periodStart').addSelect('run.period_end', 'periodEnd')
      .getRawMany<{ componentCode: string; componentName: string; amount: string; employeeCode: string; periodStart: string; periodEnd: string }>();
    return rows;
  }

  private xlsx(rows: Array<Record<string, unknown>>, name: string): GeneratedReport {
    const workbook = XLSX.utils.book_new(); const sheet = XLSX.utils.json_to_sheet(rows); XLSX.utils.book_append_sheet(workbook, sheet, 'Report');
    return { buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `${name}.xlsx` };
  }

  private pdfTable(rows: Array<Record<string, unknown>>, title: string, language: 'en' | 'bn'): Promise<GeneratedReport> {
    return this.createPdf(`${title}${language === 'bn' ? ' প্রতিবেদন' : ' report'}`, (document) => {
      for (const row of rows) { document.fontSize(9).text(Object.entries(row).map(([key, value]) => `${key}: ${this.displayValue(value)}`).join(' | ')); document.moveDown(0.35); }
    }, `hr-${title.toLowerCase().replace(/\s+/g, '-')}.pdf`, language);
  }

  private payslipPdf(payroll: PayrollEmployee, lines: PayrollLine[], language: 'en' | 'bn'): Promise<GeneratedReport> {
    const employeeName = this.displayValue(payroll.employeeSnapshot.employeeName);
    return this.createPdf(language === 'bn' ? 'বেতন বিবরণী' : 'Payslip', (document) => {
      document.fontSize(12).text(`${language === 'bn' ? 'কর্মচারী' : 'Employee'}: ${employeeName}`);
      document.text(`${language === 'bn' ? 'কর্মচারী কোড' : 'Employee code'}: ${this.displayValue(payroll.employeeSnapshot.employeeCode)}`); document.moveDown();
      for (const line of lines) document.text(`${language === 'bn' ? line.componentNameBn ?? line.componentName : line.componentName}: ${line.amount}`);
      document.moveDown().fontSize(12).text(`${language === 'bn' ? 'মোট বেতন' : 'Gross'}: ${payroll.grossAmount}`);
      document.text(`${language === 'bn' ? 'মোট কর্তন' : 'Deductions'}: ${payroll.deductionAmount}`);
      document.text(`${language === 'bn' ? 'নিট বেতন' : 'Net pay'}: ${payroll.netAmount}`);
    }, `payslip-${this.displayValue(payroll.employeeSnapshot.employeeCode) || payroll.id}.pdf`, language);
  }

  private createPdf(title: string, render: (document: PDFKit.PDFDocument) => void, filename: string, language: 'en' | 'bn'): Promise<GeneratedReport> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 40 }); const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk)); document.on('error', reject);
      document.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: 'application/pdf', filename }));
      const fontPath = language === 'bn' ? this.config.get<string>('HR_BANGLA_FONT_PATH') : this.config.get<string>('HR_ENGLISH_FONT_PATH');
      if (fontPath) document.font(fontPath);
      else if (language === 'bn') throw new BadRequestException('HR_BANGLA_FONT_PATH must point to a Unicode Bangla font before Bangla PDFs can be generated.');
      document.fontSize(18).text(title, { align: 'center' }).moveDown(); render(document); document.end();
    });
  }

  private displayValue(value: unknown) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return `${value}`;
    return JSON.stringify(value);
  }
}
