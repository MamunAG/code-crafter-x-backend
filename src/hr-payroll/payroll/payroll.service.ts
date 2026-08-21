import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { DataSource, In, Repository } from 'typeorm';
import { Employee } from '../employee/entity/employee.entity';
import { CreatePayrollRunDto, PayrollScopeOptionsDto, PayrollTransitionDto, TenantPaginationDto } from '../common/dto';
import {
  AttendanceDay,
  EmployeeLoan,
  EmployeePayrollOpening,
  EmployeeSalaryAssignment,
  HrJob,
  HrMasterData,
  LeaveBalance,
  LeaveRequest,
  LoanInstallment,
  PayrollEmployee,
  PayrollLine,
  PayrollRun,
  SalaryStructure,
  SalaryStructureComponent,
  StatutoryRulePack,
} from '../common/entity';
import { ApprovalStatus, HrJobStatus, LoanStatus, PayrollComponentType, PayrollProcessingMode, PayrollRunStatus, PayrollRunType } from '../common/hr.enums';
import { FormulaEngineService } from './formula-engine.service';
import { EXTERNAL_FORMULA_VARIABLES, HrAuditService } from '../common/services/hr-platform.service';
import { BangladeshPayrollPolicyService, BangladeshTaxRules } from './bangladesh-payroll-policy.service';
import { JOB_TYPE_HR_IMPORT } from '../imports/import.service';
import { HrMasterDataType } from '../common/hr.enums';
import { Factory } from 'src/app-configuration/factory/entity/factory.entity';
import { PayrollWorkflowService } from './payroll-workflow.service';

const JOB_TYPE_CALCULATE_PAYROLL = 'CALCULATE_PAYROLL';

@Injectable()
export class PayrollService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PayrollRun) private readonly runs: Repository<PayrollRun>,
    @InjectRepository(PayrollEmployee) private readonly payrollEmployees: Repository<PayrollEmployee>,
    @InjectRepository(PayrollLine) private readonly payrollLines: Repository<PayrollLine>,
    @InjectRepository(HrJob) private readonly jobs: Repository<HrJob>,
    @InjectRepository(StatutoryRulePack) private readonly rulePacks: Repository<StatutoryRulePack>,
    @InjectRepository(Factory) private readonly factories: Repository<Factory>,
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    @InjectRepository(HrMasterData) private readonly masterData: Repository<HrMasterData>,
    @InjectRepository(EmployeeLoan) private readonly loans: Repository<EmployeeLoan>,
    @InjectRepository(LoanInstallment) private readonly installments: Repository<LoanInstallment>,
    private readonly audit: HrAuditService,
    private readonly workflow: PayrollWorkflowService,
  ) {}

  async create(organizationId: string, userId: string, idempotencyKey: string, dto: CreatePayrollRunDto) {
    if (!idempotencyKey?.trim()) throw new BadRequestException('Idempotency-Key header is required.');
    if (dto.periodEnd < dto.periodStart) throw new BadRequestException('Payroll period end cannot precede its start.');
    const [factory, payGroup] = await Promise.all([
      this.factories.findOne({ where: { id: dto.factoryId, organizationId, isActive: true } }),
      this.masterData.findOne({ where: { id: dto.payGroupId, organizationId, type: HrMasterDataType.PayGroup, isActive: true } }),
    ]);
    if (!factory) throw new BadRequestException('Active factory not found in the selected organization.');
    if (!payGroup) throw new BadRequestException('Active pay group not found in the selected organization.');
    const processingMode = dto.processingMode ?? PayrollProcessingMode.Bulk;
    const selectionCriteria = this.selectionCriteria(dto, processingMode);
    const formulaInputs = this.formulaInputs(dto.formulaInputs);
    const eligibleEmployees = await this.findEligibleEmployees(organizationId, dto.factoryId, dto.payGroupId, dto.periodStart, dto.periodEnd, selectionCriteria);
    if (!eligibleEmployees.length) throw new BadRequestException('No active employee matches the selected payroll scope and period.');
    const replay = await this.runs.findOne({ where: { organizationId, idempotencyKey: idempotencyKey.trim() } });
    if (replay) return replay;
    let selectedRulePackId = dto.rulePackId;
    if (selectedRulePackId) {
      const pack = await this.rulePacks.findOne({ where: { id: selectedRulePackId, organizationId } });
      if (!pack || pack.reviewStatus !== ApprovalStatus.Approved) throw new BadRequestException('Payroll requires an approved statutory rule pack.');
      if (pack.effectiveFrom > dto.periodEnd || (pack.effectiveTo && pack.effectiveTo < dto.periodStart)) throw new BadRequestException('Statutory rule pack is not effective for this payroll period.');
    } else {
      const defaultPack = await this.rulePacks.createQueryBuilder('pack')
        .where('pack.organization_id = :organizationId', { organizationId })
        .andWhere('pack.review_status = :reviewStatus', { reviewStatus: ApprovalStatus.Approved })
        .andWhere('pack.effective_from <= :periodEnd', { periodEnd: dto.periodEnd })
        .andWhere('(pack.effective_to IS NULL OR pack.effective_to >= :periodStart)', { periodStart: dto.periodStart })
        .orderBy('pack.effective_from', 'DESC')
        .addOrderBy('pack.version', 'DESC')
        .getOne();
      selectedRulePackId = defaultPack?.id;
    }
    const run = this.runs.create({
      factoryId: dto.factoryId, payGroupId: dto.payGroupId, frequency: dto.frequency, runType: dto.runType,
      periodStart: dto.periodStart, periodEnd: dto.periodEnd, paymentDate: dto.paymentDate, rulePackId: selectedRulePackId,
      sequence: dto.sequence ?? 1, currency: dto.currency ?? 'BDT', processingMode, selectionCriteria, formulaInputs,
      organizationId, idempotencyKey: idempotencyKey.trim(), createdById: userId, preparedById: userId,
      snapshotMetadata: { eligibleEmployeeCount: eligibleEmployees.length },
    });
    try {
      const saved = await this.runs.save(run);
      await this.audit.record(organizationId, userId, 'CREATE', 'PayrollRun', saved.id, null, saved, { idempotencyKey });
      return saved;
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('A payroll run already exists for this scope, period, type, and sequence.');
      throw error;
    }
  }

  async list(organizationId: string, query: TenantPaginationDto) {
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const qb = this.runs.createQueryBuilder('run').leftJoinAndSelect('run.factory', 'factory').where('run.organization_id = :organizationId', { organizationId }).orderBy('run.created_at', 'DESC').skip((page - 1) * limit).take(limit);
    if (query.search) qb.andWhere('(CAST(run.id AS text) ILIKE :search OR CAST(run.status AS text) ILIKE :search)', { search: `%${query.search}%` });
    const [items, total] = await qb.getManyAndCount(); const totalPages = Math.ceil(total / limit);
    return { items, meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } };
  }

  async scopeOptions(organizationId: string, query: PayrollScopeOptionsDto) {
    const employees = await this.employees.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .where('employee.organization_id = :organizationId', { organizationId })
      .andWhere('employee.factory_id = :factoryId', { factoryId: query.factoryId })
      .andWhere('employee.pay_group_id = :payGroupId', { payGroupId: query.payGroupId })
      .andWhere('employee.is_active = true')
      .andWhere('employee.deleted_at IS NULL')
      .orderBy('employee.employee_code', 'ASC')
      .getMany();
    const items = employees.map((employee) => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      employeeName: employee.employeeName,
      departmentId: employee.departmentId ?? null,
      departmentName: employee.department?.departmentName ?? null,
      designationId: employee.designationId ?? null,
      designationName: employee.designation?.designationName ?? null,
      sectionName: employee.profile?.official?.section?.trim() || null,
    }));
    const unique = <T extends { id: string; name: string }>(values: T[]) => [...new Map(values.map((item) => [item.id, item])).values()].sort((a, b) => a.name.localeCompare(b.name));
    return {
      employees: items,
      departments: unique(items.flatMap((item) => item.departmentId && item.departmentName ? [{ id: item.departmentId, name: item.departmentName }] : [])),
      designations: unique(items.flatMap((item) => item.designationId && item.designationName ? [{ id: item.designationId, name: item.designationName }] : [])),
      sections: [...new Set(items.map((item) => item.sectionName).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b)),
      formulaVariables: [...EXTERNAL_FORMULA_VARIABLES, 'INPUT_*'],
    };
  }

  async findOne(organizationId: string, id: string) {
    const run = await this.requireRun(organizationId, id);
    const totals = await this.payrollEmployees.createQueryBuilder('payroll')
      .select('COUNT(*)', 'employees').addSelect('COALESCE(SUM(payroll.gross_amount), 0)', 'gross')
      .addSelect('COALESCE(SUM(payroll.deduction_amount), 0)', 'deductions').addSelect('COALESCE(SUM(payroll.net_amount), 0)', 'net')
      .addSelect('COUNT(*) FILTER (WHERE payroll.error IS NOT NULL)', 'failed').where('payroll.payroll_run_id = :id', { id }).getRawOne<{ employees: string; gross: string; deductions: string; net: string; failed: string }>();
    return { ...run, totals };
  }

  async details(organizationId: string, id: string, query: TenantPaginationDto) {
    await this.requireRun(organizationId, id);
    const page = query.page ?? 1; const limit = query.limit ?? 20;
    const qb = this.payrollEmployees.createQueryBuilder('payroll').where('payroll.payroll_run_id = :id', { id }).orderBy("payroll.employee_snapshot->>'employeeCode'", 'ASC').skip((page - 1) * limit).take(limit);
    if (query.search) qb.andWhere("(payroll.employee_snapshot->>'employeeCode' ILIKE :search OR payroll.employee_snapshot->>'employeeName' ILIKE :search)", { search: `%${query.search}%` });
    const [items, total] = await qb.getManyAndCount(); const totalPages = Math.ceil(total / limit);
    const lines = items.length ? await this.payrollLines.find({ where: { payrollEmployeeId: In(items.map((item) => item.id)) }, order: { componentCode: 'ASC' } }) : [];
    return { items: items.map((item) => ({ ...item, lines: lines.filter((line) => line.payrollEmployeeId === item.id) })), meta: { total, page, limit, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 } };
  }

  async calculate(organizationId: string, userId: string, id: string, dto: PayrollTransitionDto, idempotencyKey: string) {
    const run = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    if (![PayrollRunStatus.Draft, PayrollRunStatus.Failed].includes(run.status)) throw new ConflictException('Only draft or failed payroll can be calculated.');
    const existingJob = await this.jobs.createQueryBuilder('job').where('job.organization_id = :organizationId AND job.type = :type', { organizationId, type: JOB_TYPE_CALCULATE_PAYROLL })
      .andWhere("job.payload->>'payrollRunId' = :runId", { runId: id }).andWhere('job.status IN (:...statuses)', { statuses: [HrJobStatus.Queued, HrJobStatus.Running] }).getOne();
    if (existingJob) return existingJob;
    run.status = PayrollRunStatus.Calculating; run.updatedById = userId;
    await this.runs.save(run);
    const job = await this.jobs.save(this.jobs.create({ organizationId, type: JOB_TYPE_CALCULATE_PAYROLL, payload: { payrollRunId: id, requestedById: userId, idempotencyKey }, status: HrJobStatus.Queued }));
    await this.audit.record(organizationId, userId, 'CALCULATE', 'PayrollRun', id, null, { jobId: job.id }, { idempotencyKey });
    return job;
  }

  async submitReview(organizationId: string, userId: string, id: string, dto: PayrollTransitionDto) {
    const run = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    this.workflow.assertTransition(run.status, PayrollRunStatus.UnderReview, userId, run);
    run.status = PayrollRunStatus.UnderReview; run.reviewedById = userId; run.updatedById = userId;
    return this.saveTransition(run, userId, 'SUBMIT_REVIEW', dto.comment);
  }

  async approve(organizationId: string, userId: string, id: string, dto: PayrollTransitionDto) {
    const run = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    this.workflow.assertTransition(run.status, PayrollRunStatus.Approved, userId, run);
    run.status = PayrollRunStatus.Approved; run.approvedById = userId; run.updatedById = userId;
    return this.saveTransition(run, userId, 'APPROVE', dto.comment);
  }

  async lock(organizationId: string, userId: string, id: string, dto: PayrollTransitionDto) {
    const run = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    this.workflow.assertTransition(run.status, PayrollRunStatus.Locked, userId, run);
    run.status = PayrollRunStatus.Locked; run.lockedById = userId; run.lockedAt = new Date(); run.updatedById = userId;
    const saved = await this.dataSource.transaction(async (manager) => {
      const locked = await manager.save(run);
      if (run.runType === PayrollRunType.Reversal && run.reversalOfRunId) {
        await manager.update(PayrollRun, { id: run.reversalOfRunId, organizationId }, { status: PayrollRunStatus.Reversed });
        const originalPayrollRows = await manager.find(PayrollEmployee, { where: { payrollRunId: run.reversalOfRunId } });
        for (const originalPayroll of originalPayrollRows) {
          const applied = await manager.find(LoanInstallment, { where: { payrollEmployeeId: originalPayroll.id } });
          for (const installment of applied) {
            const payment = Number(installment.paidAmount); installment.paidAmount = '0.0000'; installment.paidAt = null; installment.payrollEmployeeId = null; await manager.save(installment);
            const loan = await manager.findOne(EmployeeLoan, { where: { id: installment.loanId, organizationId } });
            if (loan) { loan.outstandingAmount = (Number(loan.outstandingAmount) + payment).toFixed(4); if (loan.status === LoanStatus.Settled) loan.status = LoanStatus.Active; await manager.save(loan); }
          }
        }
      } else {
        const payrollRows = await manager.find(PayrollEmployee, { where: { payrollRunId: run.id } });
        for (const payroll of payrollRows) {
          let available = Number((payroll.inputSnapshot.calculationContext as Record<string, unknown> | undefined)?.LOAN_DEDUCTION ?? 0);
          const sourceInstallments = (payroll.inputSnapshot.loans as Array<Record<string, unknown>> | undefined) ?? [];
          for (const source of sourceInstallments) {
            if (available <= 0) break;
            const installment = await manager.findOne(LoanInstallment, { where: { id: String(source.id) } });
            if (!installment || installment.paidAt) continue;
            const payment = Math.min(available, Number(installment.amount) - Number(installment.paidAmount));
            installment.paidAmount = (Number(installment.paidAmount) + payment).toFixed(4); installment.payrollEmployeeId = payroll.id;
            if (Number(installment.paidAmount) >= Number(installment.amount)) installment.paidAt = new Date();
            await manager.save(installment); available -= payment;
            const loan = await manager.findOne(EmployeeLoan, { where: { id: installment.loanId, organizationId } });
            if (loan) { loan.outstandingAmount = Math.max(0, Number(loan.outstandingAmount) - payment).toFixed(4); if (Number(loan.outstandingAmount) === 0) loan.status = LoanStatus.Settled; await manager.save(loan); }
          }
        }
      }
      return locked;
    });
    await this.audit.record(organizationId, userId, 'LOCK', 'PayrollRun', id, null, saved, { comment: dto.comment ?? null });
    return saved;
  }

  async reject(organizationId: string, userId: string, id: string, dto: PayrollTransitionDto) {
    const run = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    this.workflow.assertTransition(run.status, PayrollRunStatus.Prepared, userId, run);
    run.status = PayrollRunStatus.Prepared; run.approvedById = null; run.reviewedById = null; run.updatedById = userId;
    return this.saveTransition(run, userId, 'REJECT', dto.comment);
  }

  async reverse(organizationId: string, userId: string, id: string, idempotencyKey: string, dto: PayrollTransitionDto) {
    const original = await this.requireVersionedRun(organizationId, id, dto.rowVersion);
    if (original.status !== PayrollRunStatus.Locked) throw new ConflictException('Only locked payroll can be reversed.');
    const replay = await this.runs.findOne({ where: { organizationId, idempotencyKey } });
    if (replay) return replay;
    const reversal = await this.runs.save(this.runs.create({
      organizationId, factoryId: original.factoryId, payGroupId: original.payGroupId, frequency: original.frequency,
      runType: PayrollRunType.Reversal, sequence: original.sequence, periodStart: original.periodStart, periodEnd: original.periodEnd,
      paymentDate: original.paymentDate, currency: original.currency, rulePackId: original.rulePackId, reversalOfRunId: original.id,
      processingMode: original.processingMode, selectionCriteria: original.selectionCriteria, formulaInputs: original.formulaInputs,
      idempotencyKey, createdById: userId, preparedById: userId, snapshotMetadata: { originalRunId: original.id },
    }));
    await this.audit.record(organizationId, userId, 'CREATE_REVERSAL', 'PayrollRun', reversal.id, original, reversal, { comment: dto.comment ?? null });
    return reversal;
  }

  jobStatus(organizationId: string, id: string) { return this.jobs.findOne({ where: { id, organizationId } }); }

  async markPaidStatus(organizationId: string, userId: string, id: string, status: string) {
    const run = await this.requireRun(organizationId, id);
    if (run.status !== PayrollRunStatus.Locked) throw new ConflictException('Paid status can only be recorded for locked payroll.');
    if (!['UNPAID', 'PROCESSING', 'PAID', 'PARTIALLY_PAID', 'FAILED'].includes(status)) throw new BadRequestException('Invalid external paid status.');
    run.paidStatus = status; run.updatedById = userId;
    return this.saveTransition(run, userId, `PAYMENT_STATUS_${status}`);
  }

  private async saveTransition(run: PayrollRun, userId: string, action: string, comment?: string) {
    const saved = await this.runs.save(run);
    await this.audit.record(run.organizationId, userId, action, 'PayrollRun', run.id, null, saved, { comment: comment ?? null });
    return saved;
  }

  private selectionCriteria(dto: CreatePayrollRunDto, processingMode: PayrollProcessingMode) {
    if (processingMode === PayrollProcessingMode.Individual) {
      if (!dto.employeeId) throw new BadRequestException('Select an employee for individual payroll processing.');
      return { employeeIds: [dto.employeeId] };
    }
    const sectionNames = dto.sectionName?.trim() ? [dto.sectionName.trim()] : [];
    const criteria = {
      departmentIds: dto.departmentId ? [dto.departmentId] : [],
      designationIds: dto.designationId ? [dto.designationId] : [],
      sectionNames,
      includeAllEligible: dto.includeAllEligible === true,
    };
    if (!criteria.includeAllEligible && !criteria.departmentIds.length && !criteria.designationIds.length && !criteria.sectionNames.length) {
      throw new BadRequestException('Select a department, section, or designation, or enable all eligible employees for bulk payroll.');
    }
    return criteria;
  }

  private formulaInputs(value?: Record<string, unknown>) {
    const result: Record<string, number> = {};
    for (const [rawKey, rawValue] of Object.entries(value ?? {})) {
      const key = rawKey.trim().toUpperCase();
      const numeric = typeof rawValue === 'number' ? rawValue : Number.NaN;
      if (!/^[A-Z_][A-Z0-9_]*$/.test(key)) throw new BadRequestException(`Formula input ${rawKey} is not a valid variable name.`);
      if (!EXTERNAL_FORMULA_VARIABLES.includes(key) && !key.startsWith('INPUT_')) throw new BadRequestException(`Custom formula input ${rawKey} must start with INPUT_.`);
      if (!Number.isFinite(numeric)) throw new BadRequestException(`Formula input ${rawKey} must be numeric.`);
      result[key] = numeric;
    }
    return result;
  }

  private async findEligibleEmployees(organizationId: string, factoryId: string, payGroupId: string, periodStart: string, periodEnd: string, criteria: Record<string, unknown>) {
    const qb = this.employees.createQueryBuilder('employee')
      .where('employee.organization_id = :organizationId', { organizationId })
      .andWhere('employee.factory_id = :factoryId', { factoryId })
      .andWhere('employee.pay_group_id = :payGroupId', { payGroupId })
      .andWhere('employee.is_active = true')
      .andWhere('employee.joining_date <= :periodEnd', { periodEnd })
      .andWhere('(employee.separation_date IS NULL OR employee.separation_date >= :periodStart)', { periodStart })
      .andWhere('employee.deleted_at IS NULL');
    const employeeIds = this.criteriaStrings(criteria, 'employeeIds');
    const departmentIds = this.criteriaStrings(criteria, 'departmentIds');
    const designationIds = this.criteriaStrings(criteria, 'designationIds');
    if (employeeIds.length) qb.andWhere('employee.id IN (:...employeeIds)', { employeeIds });
    if (departmentIds.length) qb.andWhere('employee.department_id IN (:...departmentIds)', { departmentIds });
    if (designationIds.length) qb.andWhere('employee.designation_id IN (:...designationIds)', { designationIds });
    const employees = await qb.getMany();
    const sections = this.criteriaStrings(criteria, 'sectionNames').map((item) => item.trim().toLocaleLowerCase());
    return sections.length ? employees.filter((employee) => sections.includes(employee.profile?.official?.section?.trim().toLocaleLowerCase() ?? '')) : employees;
  }

  private criteriaStrings(criteria: Record<string, unknown>, key: string) {
    const value = criteria[key];
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
  }

  private async requireRun(organizationId: string, id: string) {
    const run = await this.runs.findOne({ where: { id, organizationId } });
    if (!run) throw new NotFoundException('Payroll run not found.');
    return run;
  }

  private async requireVersionedRun(organizationId: string, id: string, rowVersion: number) {
    const run = await this.requireRun(organizationId, id);
    if (run.rowVersion !== rowVersion) throw new ConflictException('Payroll was changed by another user. Refresh and retry.');
    return run;
  }
}

@Injectable()
export class PayrollWorkerService {
  private readonly logger = new Logger(PayrollWorkerService.name);
  private readonly workerId = `${process.pid}-${randomUUID()}`;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(HrJob) private readonly jobs: Repository<HrJob>,
    @InjectRepository(PayrollRun) private readonly runs: Repository<PayrollRun>,
    @InjectRepository(Employee) private readonly employees: Repository<Employee>,
    @InjectRepository(EmployeeSalaryAssignment) private readonly assignments: Repository<EmployeeSalaryAssignment>,
    @InjectRepository(SalaryStructure) private readonly structures: Repository<SalaryStructure>,
    @InjectRepository(SalaryStructureComponent) private readonly components: Repository<SalaryStructureComponent>,
    @InjectRepository(AttendanceDay) private readonly attendanceDays: Repository<AttendanceDay>,
    @InjectRepository(EmployeeLoan) private readonly loans: Repository<EmployeeLoan>,
    @InjectRepository(LoanInstallment) private readonly installments: Repository<LoanInstallment>,
    @InjectRepository(PayrollEmployee) private readonly payrollEmployees: Repository<PayrollEmployee>,
    @InjectRepository(PayrollLine) private readonly payrollLines: Repository<PayrollLine>,
    @InjectRepository(StatutoryRulePack) private readonly rulePacks: Repository<StatutoryRulePack>,
    @InjectRepository(HrMasterData) private readonly masterData: Repository<HrMasterData>,
    @InjectRepository(LeaveBalance) private readonly leaveBalances: Repository<LeaveBalance>,
    @InjectRepository(LeaveRequest) private readonly leaveRequests: Repository<LeaveRequest>,
    @InjectRepository(EmployeePayrollOpening) private readonly openings: Repository<EmployeePayrollOpening>,
    private readonly formulas: FormulaEngineService,
    private readonly policy: BangladeshPayrollPolicyService,
    private readonly audit: HrAuditService,
  ) {}

  async pollOnce() {
    const job = await this.claimJob();
    if (!job) return false;
    try {
      if (job.type === JOB_TYPE_CALCULATE_PAYROLL) await this.processPayroll(job);
      else if (job.type === JOB_TYPE_HR_IMPORT) await this.processImport(job);
      else throw new Error(`Unsupported HR job type: ${job.type}`);
      job.status = HrJobStatus.Completed; job.progress = 100; job.result = { ...(job.result ?? {}), completedAt: new Date().toISOString() }; job.leaseExpiresAt = null; job.leaseOwner = null;
      await this.jobs.save(job);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed`, error instanceof Error ? error.stack : String(error));
      job.error = error instanceof Error ? error.message : String(error); job.leaseExpiresAt = null; job.leaseOwner = null;
      if (job.attempts < job.maxAttempts) { job.status = HrJobStatus.Queued; job.availableAt = new Date(Date.now() + 30000 * job.attempts); }
      else job.status = HrJobStatus.Failed;
      await this.jobs.save(job);
      const runId = this.payloadString(job.payload, 'payrollRunId');
      if (job.status === HrJobStatus.Failed && runId) await this.runs.update({ id: runId }, { status: PayrollRunStatus.Failed });
    }
    return true;
  }

  async recoverStalledJobs() {
    await this.jobs.createQueryBuilder().update(HrJob).set({ status: HrJobStatus.Queued, leaseOwner: null, leaseExpiresAt: null, availableAt: new Date() })
      .where('status = :status AND lease_expires_at < now()', { status: HrJobStatus.Running }).execute();
  }

  private async claimJob() {
    return this.dataSource.transaction(async (manager) => {
      const candidate = await manager.getRepository(HrJob).createQueryBuilder('job').setLock('pessimistic_write').setOnLocked('skip_locked')
        .where('job.status = :status AND job.available_at <= now()', { status: HrJobStatus.Queued }).orderBy('job.created_at', 'ASC').getOne();
      if (!candidate) return null;
      candidate.status = HrJobStatus.Running; candidate.attempts += 1; candidate.leaseOwner = this.workerId; candidate.leaseExpiresAt = new Date(Date.now() + 120000);
      return manager.save(candidate);
    });
  }

  private async processPayroll(job: HrJob) {
    const runId = String(job.payload.payrollRunId);
    const run = await this.runs.findOne({ where: { id: runId, organizationId: job.organizationId } });
    if (!run || run.status !== PayrollRunStatus.Calculating) throw new Error('Payroll run is missing or no longer calculating.');
    if (run.runType === PayrollRunType.Reversal) {
      await this.processReversal(run, job);
      return;
    }
    const employeeQuery = this.employees.createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department')
      .leftJoinAndSelect('employee.designation', 'designation')
      .where('employee.organization_id = :organizationId AND employee.factory_id = :factoryId AND employee.pay_group_id = :payGroupId', run)
      .andWhere('employee.is_active = true')
      .andWhere('employee.joining_date <= :periodEnd', run)
      .andWhere('(employee.separation_date IS NULL OR employee.separation_date >= :periodStart)', run)
      .andWhere('employee.deleted_at IS NULL')
      .orderBy('employee.id', 'ASC');
    const employeeIds = this.selectionStrings(run.selectionCriteria, 'employeeIds');
    const departmentIds = this.selectionStrings(run.selectionCriteria, 'departmentIds');
    const designationIds = this.selectionStrings(run.selectionCriteria, 'designationIds');
    if (employeeIds.length) employeeQuery.andWhere('employee.id IN (:...employeeIds)', { employeeIds });
    if (departmentIds.length) employeeQuery.andWhere('employee.department_id IN (:...departmentIds)', { departmentIds });
    if (designationIds.length) employeeQuery.andWhere('employee.designation_id IN (:...designationIds)', { designationIds });
    let employees = await employeeQuery.getMany();
    const sectionNames = this.selectionStrings(run.selectionCriteria, 'sectionNames').map((item) => item.trim().toLocaleLowerCase());
    if (sectionNames.length) employees = employees.filter((employee) => sectionNames.includes(employee.profile?.official?.section?.trim().toLocaleLowerCase() ?? ''));
    if (!employees.length) throw new Error('No active employee matches the payroll scope at calculation time.');
    await this.payrollLines.createQueryBuilder().delete().where('payroll_employee_id IN (SELECT id FROM hr_payroll_employees WHERE payroll_run_id = :runId)', { runId }).execute();
    await this.payrollEmployees.delete({ payrollRunId: runId });
    const assignments = employees.length ? await this.assignments.createQueryBuilder('assignment').where('assignment.organization_id = :organizationId', run)
      .andWhere('assignment.employee_id IN (:...employeeIds)', { employeeIds: employees.map((item) => item.id) }).andWhere('assignment.effective_from <= :periodEnd', run)
      .andWhere('(assignment.effective_to IS NULL OR assignment.effective_to >= :periodStart)', run).orderBy('assignment.effective_from', 'DESC').getMany() : [];
    const structureIds = [...new Set(assignments.map((item) => item.salaryStructureId))];
    const structures = structureIds.length ? await this.structures.find({ where: { id: In(structureIds) } }) : [];
    const componentRows = structureIds.length ? await this.components.find({ where: { salaryStructureId: In(structureIds) }, order: { sortOrder: 'ASC' } }) : [];
    const attendance: AttendanceAggregate[] = employees.length ? await this.attendanceDays.createQueryBuilder('day').select('day.employee_id', 'employeeId')
      .addSelect('COUNT(*)', 'calendarDays').addSelect("COUNT(*) FILTER (WHERE day.status = 'PRESENT')", 'presentDays')
      .addSelect("COUNT(*) FILTER (WHERE day.status = 'ABSENT')", 'absentDays').addSelect("COUNT(*) FILTER (WHERE day.status = 'LEAVE')", 'leaveDays')
      .addSelect("COUNT(*) FILTER (WHERE day.status = 'HOLIDAY')", 'holidayDays').addSelect("COUNT(*) FILTER (WHERE day.status = 'WEEKLY_OFF')", 'weeklyOffDays')
      .addSelect("COUNT(*) FILTER (WHERE day.status = 'MISSING_PUNCH')", 'missingPunchDays')
      .addSelect('COALESCE(SUM(day.worked_minutes), 0)', 'workedMinutes').addSelect('COALESCE(SUM(day.overtime_minutes), 0)', 'overtimeMinutes')
      .addSelect('COALESCE(SUM(day.late_minutes), 0)', 'lateMinutes').addSelect('COALESCE(SUM(day.early_exit_minutes), 0)', 'earlyExitMinutes')
      .where('day.organization_id = :organizationId', run).andWhere('day.employee_id IN (:...employeeIds)', { employeeIds: employees.map((item) => item.id) })
      .andWhere('day.work_date BETWEEN :periodStart AND :periodEnd', run).groupBy('day.employee_id').getRawMany<AttendanceAggregate>() : [];
    const activeLoans = employees.length ? await this.loans.find({ where: { organizationId: run.organizationId, employeeId: In(employees.map((item) => item.id)), status: LoanStatus.Active } }) : [];
    const loanInstallments = activeLoans.length ? await this.installments.createQueryBuilder('installment').where('installment.loan_id IN (:...loanIds)', { loanIds: activeLoans.map((item) => item.id) })
      .andWhere('installment.due_date <= :periodEnd AND installment.paid_at IS NULL', run).getMany() : [];
    const rulePack = run.rulePackId ? await this.rulePacks.findOne({ where: { id: run.rulePackId, organizationId: run.organizationId } }) : null;
    const openingRows = employees.length ? await this.openings.find({ where: { organizationId: run.organizationId, employeeId: In(employees.map((item) => item.id)), taxYear: Number(run.periodEnd.slice(0, 4)) } }) : [];
    const leaveRequests = employees.length ? await this.leaveRequests.createQueryBuilder('request')
      .where('request.organization_id = :organizationId', run)
      .andWhere('request.employee_id IN (:...employeeIds)', { employeeIds: employees.map((item) => item.id) })
      .andWhere('request.status = :leaveStatus', { leaveStatus: ApprovalStatus.Approved })
      .andWhere('request.start_date <= :periodEnd AND request.end_date >= :periodStart', run)
      .getMany() : [];
    const leaveTypeIds = [...new Set(leaveRequests.map((item) => item.leaveTypeId))];
    const leaveTypes = leaveTypeIds.length ? await this.masterData.find({ where: { organizationId: run.organizationId, id: In(leaveTypeIds), type: HrMasterDataType.LeaveType } }) : [];
    let processed = 0; let failed = 0;
    for (const chunk of this.chunk(employees, 250)) {
      for (const employee of chunk) {
        try {
          const assignment = assignments.find((item) => item.employeeId === employee.id);
          if (!assignment) throw new Error('No effective salary assignment.');
          const structure = structures.find((item) => item.id === assignment.salaryStructureId);
          if (!structure) throw new Error('Salary structure not found.');
          const components = componentRows.filter((item) => item.salaryStructureId === structure.id);
          const attendanceRow: Partial<AttendanceAggregate> = attendance.find((item) => item.employeeId === employee.id) ?? {};
          const employeeLoans = activeLoans.filter((item) => item.employeeId === employee.id);
          const dueInstallments = loanInstallments.filter((item) => employeeLoans.some((loan) => loan.id === item.loanId));
          const leave = this.leaveSummary(employee.id, run.periodStart, run.periodEnd, leaveRequests, leaveTypes);
          const attendanceLeaveDays = Number(attendanceRow.leaveDays ?? 0);
          const unmatchedLeaveDays = Math.max(0, attendanceLeaveDays - leave.totalDays);
          const paidLeaveDays = leave.paidDays;
          const unpaidLeaveDays = leave.unpaidDays + unmatchedLeaveDays;
          const formulaInputs = this.numericInputs(run.formulaInputs);
          const context: Record<string, number> = {
            BASE: Number(assignment.baseAmount), CALENDAR_DAYS: Number(attendanceRow.calendarDays ?? 0),
            WORKING_DAYS: Number(attendanceRow.presentDays ?? 0) + Number(attendanceRow.absentDays ?? 0) + attendanceLeaveDays + Number(attendanceRow.missingPunchDays ?? 0),
            PAYABLE_DAYS: Number(attendanceRow.presentDays ?? 0) + paidLeaveDays + Number(attendanceRow.holidayDays ?? 0) + Number(attendanceRow.weeklyOffDays ?? 0),
            PRESENT_DAYS: Number(attendanceRow.presentDays ?? 0), ABSENT_DAYS: Number(attendanceRow.absentDays ?? 0),
            LEAVE_DAYS: Math.max(attendanceLeaveDays, leave.totalDays), PAID_LEAVE_DAYS: paidLeaveDays, UNPAID_LEAVE_DAYS: unpaidLeaveDays,
            HOLIDAY_DAYS: Number(attendanceRow.holidayDays ?? 0), WEEKLY_OFF_DAYS: Number(attendanceRow.weeklyOffDays ?? 0), MISSING_PUNCH_DAYS: Number(attendanceRow.missingPunchDays ?? 0),
            WORKED_HOURS: Number(attendanceRow.workedMinutes ?? 0) / 60, OVERTIME_HOURS: Number(attendanceRow.overtimeMinutes ?? 0) / 60,
            APPROVED_OT_MINUTES: Number(attendanceRow.overtimeMinutes ?? 0), LATE_MINUTES: Number(attendanceRow.lateMinutes ?? 0), EARLY_EXIT_MINUTES: Number(attendanceRow.earlyExitMinutes ?? 0),
            LOAN_DEDUCTION: dueInstallments.reduce((sum, item) => sum + Math.min(Number(item.amount) - Number(item.paidAmount), Number(employeeLoans.find((loan) => loan.id === item.loanId)?.outstandingAmount ?? 0)), 0),
            LOAN_OUTSTANDING: employeeLoans.reduce((sum, loan) => sum + Number(loan.outstandingAmount), 0),
            ARREARS: 0, BONUS: 0, TAX_DEDUCTION: 0, PF_EMPLOYEE: 0, PF_EMPLOYER: 0, GRATUITY: 0,
          };
          const rules = rulePack?.rules ?? {};
          const taxRules = rules.tax as BangladeshTaxRules | undefined;
          const periodsPerYear = { WEEKLY: 52, BIWEEKLY: 26, SEMIMONTHLY: 24, MONTHLY: 12 }[run.frequency];
          const opening = openingRows.find((item) => item.employeeId === employee.id);
          if (taxRules) context.TAX_DEDUCTION = this.policy.calculateMonthlyWithholding(Number(assignment.baseAmount) * periodsPerYear, Number(opening?.taxWithheld ?? 0), periodsPerYear, taxRules);
          const providentFund = rules.providentFund as { enabled?: boolean; employeeRate?: number; employerRate?: number } | undefined;
          if (providentFund?.enabled) {
            context.PF_EMPLOYEE = Number(assignment.baseAmount) * Number(providentFund.employeeRate ?? 0);
            context.PF_EMPLOYER = Number(assignment.baseAmount) * Number(providentFund.employerRate ?? 0);
          }
          Object.assign(context, formulaInputs);
          Object.assign(context, Object.fromEntries(Object.entries(assignment.componentOverrides ?? {}).map(([key, value]) => [key.toUpperCase(), Number(value)])));
          const ordered = this.formulas.orderDefinitions(components, [...EXTERNAL_FORMULA_VARIABLES, ...Object.keys(formulaInputs)]);
          const calculated = ordered.map((component) => {
            const result = this.formulas.evaluate(component.formula, context); context[component.code.toUpperCase()] = result.value;
            return { component, result };
          });
          const gross = calculated.filter((item) => item.component.type === PayrollComponentType.Earning).reduce((sum, item) => sum + item.result.value, 0);
          const deductions = calculated.filter((item) => item.component.type === PayrollComponentType.Deduction).reduce((sum, item) => sum + item.result.value, 0);
          const employer = calculated.filter((item) => item.component.type === PayrollComponentType.EmployerContribution).reduce((sum, item) => sum + item.result.value, 0);
          const warnings = [
            ...(Number(attendanceRow.calendarDays ?? 0) === 0 ? ['NO_ATTENDANCE_DATA'] : []),
            ...(unmatchedLeaveDays > 0 ? ['LEAVE_WITHOUT_APPROVED_POLICY'] : []),
            ...(Number(attendanceRow.missingPunchDays ?? 0) > 0 ? ['MISSING_PUNCH'] : []),
            ...(gross - deductions < 0 ? ['NEGATIVE_NET_PAY'] : []),
          ];
          const payrollEmployee = await this.payrollEmployees.save(this.payrollEmployees.create({ payrollRunId: run.id, employeeId: employee.id,
            employeeSnapshot: { employeeCode: employee.employeeCode, employeeName: employee.employeeName, factoryId: employee.factoryId, departmentId: employee.departmentId, departmentName: employee.department?.departmentName ?? null, designationId: employee.designationId, designationName: employee.designation?.designationName ?? null, sectionName: employee.profile?.official?.section?.trim() || null, payGroupId: employee.payGroupId },
            inputSnapshot: { salaryAssignment: assignment, attendance: attendanceRow, leave, calculationContext: context, formulaInputs, rulePack: rulePack ? { id: rulePack.id, code: rulePack.code, version: rulePack.version, rules: rulePack.rules } : null, loans: dueInstallments },
            grossAmount: this.money(gross), deductionAmount: this.money(deductions), employerContributionAmount: this.money(employer), netAmount: this.money(gross - deductions), warnings,
          }));
          await this.payrollLines.save(calculated.map(({ component, result }) => this.payrollLines.create({ payrollEmployeeId: payrollEmployee.id, componentCode: component.code, componentName: component.name, componentNameBn: component.nameBn, type: component.type, amount: this.money(result.value), formula: component.formula, formulaVersion: structure.version, calculationTrace: result.trace })));
        } catch (error) {
          failed += 1;
          await this.payrollEmployees.save(this.payrollEmployees.create({ payrollRunId: run.id, employeeId: employee.id, employeeSnapshot: { employeeCode: employee.employeeCode, employeeName: employee.employeeName }, inputSnapshot: {}, error: error instanceof Error ? error.message : String(error), grossAmount: '0', deductionAmount: '0', employerContributionAmount: '0', netAmount: '0', warnings: [] }));
        }
        processed += 1;
      }
      job.progress = employees.length ? Math.floor(processed / employees.length * 100) : 100; job.leaseExpiresAt = new Date(Date.now() + 120000); await this.jobs.save(job);
    }
    run.status = failed ? PayrollRunStatus.Failed : PayrollRunStatus.Prepared;
    run.snapshotMetadata = { employeeCount: employees.length, processed, failed, calculatedAt: new Date().toISOString(), rulePackId: rulePack?.id ?? null };
    await this.runs.save(run);
    if (rulePack && !rulePack.lockedAt) { rulePack.lockedAt = new Date(); await this.rulePacks.save(rulePack); }
    for (const structure of structures) if (!structure.lockedAt) { structure.lockedAt = new Date(); await this.structures.save(structure); }
    await this.audit.record(run.organizationId, this.payloadString(job.payload, 'requestedById'), failed ? 'CALCULATION_FAILED' : 'PREPARED', 'PayrollRun', run.id, null, run, { processed, failed });
    if (failed) throw new Error(`${failed} employee payroll calculations failed. Review the failure report.`);
  }

  private async processReversal(run: PayrollRun, job: HrJob) {
    if (!run.reversalOfRunId) throw new Error('Reversal payroll does not reference its original run.');
    const original = await this.runs.findOne({ where: { id: run.reversalOfRunId, organizationId: run.organizationId } });
    if (!original || ![PayrollRunStatus.Locked, PayrollRunStatus.Reversed].includes(original.status)) throw new Error('Original locked payroll run not found.');
    const sourceEmployees = await this.payrollEmployees.find({ where: { payrollRunId: original.id } });
    await this.payrollLines.createQueryBuilder().delete().where('payroll_employee_id IN (SELECT id FROM hr_payroll_employees WHERE payroll_run_id = :runId)', { runId: run.id }).execute();
    await this.payrollEmployees.delete({ payrollRunId: run.id });
    let processed = 0;
    for (const source of sourceEmployees) {
      const sourceLines = await this.payrollLines.find({ where: { payrollEmployeeId: source.id } });
      const target = await this.payrollEmployees.save(this.payrollEmployees.create({
        payrollRunId: run.id, employeeId: source.employeeId, employeeSnapshot: source.employeeSnapshot,
        inputSnapshot: { reversalOfPayrollEmployeeId: source.id, originalInputSnapshot: source.inputSnapshot },
        grossAmount: this.money(-Number(source.grossAmount)), deductionAmount: this.money(-Number(source.deductionAmount)),
        employerContributionAmount: this.money(-Number(source.employerContributionAmount)), netAmount: this.money(-Number(source.netAmount)),
        warnings: [], error: source.error,
      }));
      await this.payrollLines.save(sourceLines.map((line) => this.payrollLines.create({
        payrollEmployeeId: target.id, componentCode: line.componentCode, componentName: line.componentName,
        componentNameBn: line.componentNameBn, type: line.type, amount: this.money(-Number(line.amount)), formula: `REVERSAL(${line.formula})`,
        formulaVersion: line.formulaVersion, calculationTrace: { reversalOfLineId: line.id, originalTrace: line.calculationTrace },
      })));
      processed += 1; job.progress = sourceEmployees.length ? Math.floor(processed / sourceEmployees.length * 100) : 100;
      if (processed % 250 === 0) await this.jobs.save(job);
    }
    run.status = PayrollRunStatus.Prepared; run.snapshotMetadata = { reversalOfRunId: original.id, employeeCount: sourceEmployees.length, calculatedAt: new Date().toISOString() };
    await this.runs.save(run);
    await this.audit.record(run.organizationId, this.payloadString(job.payload, 'requestedById'), 'PREPARED_REVERSAL', 'PayrollRun', run.id, original, run);
  }

  private async processImport(job: HrJob) {
    const type = this.payloadString(job.payload, 'importType');
    const rows = (job.payload.rows as Array<Record<string, unknown>> | undefined) ?? [];
    const userId = this.payloadString(job.payload, 'requestedById');
    const report = { totalRows: rows.length, inserted: 0, updated: 0, failed: 0, errors: [] as Array<{ row: number; message: string }> };
    const employeeCodes = [...new Set(rows.map((row) => this.text(row, 'employeeCode')).filter(Boolean))];
    const employeeRows = employeeCodes.length ? await this.employees.find({ where: { organizationId: job.organizationId, employeeCode: In(employeeCodes) } }) : [];
    const byCode = new Map(employeeRows.map((employee) => [employee.employeeCode.trim().toUpperCase(), employee]));
    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      try {
        const code = this.text(row, 'employeeCode').toUpperCase(); const employee = byCode.get(code);
        if (!employee) throw new Error(`Employee ${code || '(blank)'} not found.`);
        if (type === 'employee-details') {
          const allowed = ['phoneNo', 'email', 'address', 'maritalStatus', 'taxStatus', 'probationEndDate', 'confirmationDate', 'contractEndDate'] as const;
          for (const field of allowed) { const value = this.optionalText(row, field); if (value !== undefined) (employee as unknown as Record<string, unknown>)[field] = value; }
          await this.employees.save(employee); report.updated += 1;
        } else if (type === 'leave-balances') {
          const leaveTypeCode = this.text(row, 'leaveTypeCode').toUpperCase();
          const leaveType = await this.masterData.findOne({ where: { organizationId: job.organizationId, type: HrMasterDataType.LeaveType, code: leaveTypeCode } });
          if (!leaveType) throw new Error(`Leave type ${leaveTypeCode} not found.`);
          const periodYear = this.number(row, 'periodYear');
          let balance = await this.leaveBalances.findOne({ where: { organizationId: job.organizationId, employeeId: employee.id, leaveTypeId: leaveType.id, periodYear } });
          const isNew = !balance;
          balance ??= this.leaveBalances.create({ organizationId: job.organizationId, employeeId: employee.id, leaveTypeId: leaveType.id, periodYear, createdById: userId });
          balance.opening = String(this.number(row, 'opening', 0)); balance.accrued = String(this.number(row, 'accrued', 0)); balance.used = String(this.number(row, 'used', 0)); balance.adjusted = String(this.number(row, 'adjusted', 0)); balance.encashed = String(this.number(row, 'encashed', 0));
          await this.leaveBalances.save(balance); if (isNew) report.inserted += 1; else report.updated += 1;
        } else if (type === 'payroll-ytd') {
          const taxYear = this.number(row, 'taxYear');
          let opening = await this.openings.findOne({ where: { organizationId: job.organizationId, employeeId: employee.id, taxYear } }); const isNew = !opening;
          opening ??= this.openings.create({ organizationId: job.organizationId, employeeId: employee.id, taxYear, createdById: userId, earnings: {}, deductions: {} });
          opening.taxableIncome = String(this.number(row, 'taxableIncome', 0)); opening.taxWithheld = String(this.number(row, 'taxWithheld', 0));
          await this.openings.save(opening); if (isNew) report.inserted += 1; else report.updated += 1;
        } else if (type === 'salary-assignments') {
          const structureCode = this.text(row, 'structureCode').toUpperCase(); const version = this.number(row, 'version', 1);
          const structure = await this.structures.findOne({ where: { organizationId: job.organizationId, code: structureCode, version, isActive: true } });
          if (!structure) throw new Error(`Active salary structure ${structureCode} v${version} not found.`);
          const effectiveFrom = this.text(row, 'effectiveFrom');
          const overlap = await this.assignments.createQueryBuilder('assignment').where('assignment.organization_id = :organizationId AND assignment.employee_id = :employeeId', { organizationId: job.organizationId, employeeId: employee.id })
            .andWhere('assignment.effective_from <= :endDate AND (assignment.effective_to IS NULL OR assignment.effective_to >= :effectiveFrom)', { endDate: this.optionalText(row, 'effectiveTo') ?? '9999-12-31', effectiveFrom }).getOne();
          if (overlap) throw new Error('Salary assignment overlaps an existing assignment.');
          await this.assignments.save(this.assignments.create({ organizationId: job.organizationId, employeeId: employee.id, salaryStructureId: structure.id, effectiveFrom, effectiveTo: this.optionalText(row, 'effectiveTo'), baseAmount: String(this.number(row, 'baseAmount')), currency: this.optionalText(row, 'currency') ?? 'BDT', componentOverrides: {}, createdById: userId })); report.inserted += 1;
        } else if (type === 'loans') {
          const loanNumber = this.text(row, 'loanNumber'); if (await this.loans.findOne({ where: { organizationId: job.organizationId, loanNumber } })) throw new Error(`Loan ${loanNumber} already exists.`);
          const principal = this.number(row, 'principal'); const installmentAmount = this.number(row, 'installmentAmount'); const startDate = this.text(row, 'startDate');
          const loan = await this.loans.save(this.loans.create({ organizationId: job.organizationId, employeeId: employee.id, loanNumber, principal: String(principal), installmentAmount: String(installmentAmount), outstandingAmount: String(principal), startDate, status: LoanStatus.Draft, createdById: userId }));
          let remaining = principal; const due = new Date(`${startDate}T00:00:00Z`); const schedule: LoanInstallment[] = [];
          while (remaining > 0 && schedule.length < 600) { const amount = Math.min(remaining, installmentAmount); schedule.push(this.installments.create({ loanId: loan.id, dueDate: due.toISOString().slice(0, 10), amount: String(amount), paidAmount: '0' })); remaining = Number((remaining - amount).toFixed(4)); due.setUTCMonth(due.getUTCMonth() + 1); }
          await this.installments.save(schedule); report.inserted += 1;
        } else throw new Error(`Unsupported import type ${type}.`);
      } catch (error) {
        report.failed += 1; if (report.errors.length < 1000) report.errors.push({ row: index + 2, message: error instanceof Error ? error.message : String(error) });
      }
      job.progress = Math.floor((index + 1) / rows.length * 100); if ((index + 1) % 250 === 0) { job.result = report; job.leaseExpiresAt = new Date(Date.now() + 120000); await this.jobs.save(job); }
    }
    job.result = report;
    await this.audit.record(job.organizationId, userId, 'IMPORT', 'HrImport', job.id, null, report, { importType: type, filename: job.payload.filename });
  }

  private chunk<T>(values: T[], size: number) { return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size)); }
  private selectionStrings(criteria: Record<string, unknown> | null | undefined, key: string) { const value = criteria?.[key]; return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : []; }
  private numericInputs(inputs: Record<string, number> | null | undefined) { return Object.fromEntries(Object.entries(inputs ?? {}).filter(([, value]) => Number.isFinite(Number(value))).map(([key, value]) => [key.toUpperCase(), Number(value)])); }
  private leaveSummary(employeeId: string, periodStart: string, periodEnd: string, requests: LeaveRequest[], leaveTypes: HrMasterData[]) {
    let paidDays = 0; let unpaidDays = 0;
    const details: Array<{ requestId: string; leaveTypeId: string; classification: string; days: number }> = [];
    for (const request of requests.filter((item) => item.employeeId === employeeId)) {
      const type = leaveTypes.find((item) => item.id === request.leaveTypeId);
      const rawClassification = type?.settings?.leaveClassification;
      const classification = typeof rawClassification === 'string' && rawClassification.toUpperCase() === 'UNPAID' ? 'UNPAID' : 'PAID';
      const breakdownDays = (request.dayBreakdown ?? []).reduce((sum, row) => {
        const date = typeof row.date === 'string' ? row.date : '';
        return date >= periodStart && date <= periodEnd ? sum + Number(row.chargedDays ?? 0) : sum;
      }, 0);
      const days = breakdownDays > 0 ? breakdownDays : this.overlappingLeaveDays(request, periodStart, periodEnd);
      if (classification === 'UNPAID') unpaidDays += days; else paidDays += days;
      details.push({ requestId: request.id, leaveTypeId: request.leaveTypeId, classification, days });
    }
    return { paidDays, unpaidDays, totalDays: paidDays + unpaidDays, details };
  }
  private overlappingLeaveDays(request: LeaveRequest, periodStart: string, periodEnd: string) {
    const start = new Date(`${request.startDate > periodStart ? request.startDate : periodStart}T00:00:00Z`);
    const end = new Date(`${request.endDate < periodEnd ? request.endDate : periodEnd}T00:00:00Z`);
    if (end < start) return 0;
    const overlapCalendarDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    const requestCalendarDays = Math.floor((new Date(`${request.endDate}T00:00:00Z`).getTime() - new Date(`${request.startDate}T00:00:00Z`).getTime()) / 86400000) + 1;
    return Number(request.days) * overlapCalendarDays / Math.max(1, requestCalendarDays);
  }
  private money(value: number) { return (Math.round((value + Number.EPSILON) * 10000) / 10000).toFixed(4); }
  private optionalText(row: Record<string, unknown>, key: string) { const match = Object.keys(row).find((item) => item.replace(/[ _-]/g, '').toLowerCase() === key.toLowerCase()); const value = match ? row[match] : undefined; if (value == null || !['string', 'number', 'boolean'].includes(typeof value)) return undefined; const text = `${value as string | number | boolean}`.trim(); return text || undefined; }
  private text(row: Record<string, unknown>, key: string) { return this.optionalText(row, key) ?? ''; }
  private number(row: Record<string, unknown>, key: string, fallback?: number) { const value = this.optionalText(row, key); if (value === undefined && fallback !== undefined) return fallback; const parsed = Number(value); if (!Number.isFinite(parsed)) throw new Error(`${key} must be numeric.`); return parsed; }
  private payloadString(payload: Record<string, unknown>, key: string) { const value = payload[key]; return typeof value === 'string' ? value : ''; }
}

type AttendanceAggregate = {
  employeeId: string;
  calendarDays: string;
  presentDays: string;
  absentDays: string;
  leaveDays: string;
  holidayDays: string;
  weeklyOffDays: string;
  missingPunchDays: string;
  workedMinutes: string;
  overtimeMinutes: string;
  lateMinutes: string;
  earlyExitMinutes: string;
};
