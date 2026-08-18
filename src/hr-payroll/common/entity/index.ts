import { OrganizationSettings } from '../../master-data/organization-settings/entity/organization-settings.entity';
import { MasterData } from '../../master-data/master-data/entity/master-data.entity';
import { AuditEvent } from '../../audit/entity/audit-event.entity';
import { EmployeeEmploymentHistory } from '../../employee/entity/employee-employment-history.entity';
import { Shift } from '../../master-data/shift/entity/shift.entity';
import { RosterAssignment } from '../../roster/entity/roster-assignment.entity';
import { AttendanceIntegrationCredential } from '../../attendance/entity/attendance-integration-credential.entity';
import { AttendancePunch } from '../../attendance/entity/attendance-punch.entity';
import { AttendanceDay } from '../../attendance/entity/attendance-day.entity';
import { AttendanceCorrection } from '../../attendance/entity/attendance-correction.entity';
import { OvertimeRequest } from '../../attendance/entity/overtime-request.entity';
import { LeaveBalance } from '../../leave/entity/leave-balance.entity';
import { LeaveRequest } from '../../leave/entity/leave-request.entity';
import { SalaryStructure } from '../../master-data/salary-structure/entity/salary-structure.entity';
import { SalaryStructureComponent } from '../../master-data/salary-structure/entity/salary-structure-component.entity';
import { EmployeeSalaryAssignment } from '../../salary/entity/employee-salary-assignment.entity';
import { EmployeePayrollOpening } from '../../salary/entity/employee-payroll-opening.entity';
import { EmployeeLoan } from '../../loan/entity/employee-loan.entity';
import { LoanInstallment } from '../../loan/entity/loan-installment.entity';
import { StatutoryRulePack } from '../../master-data/statutory-rule/entity/statutory-rule.entity';
import { PayrollRun } from '../../payroll/entity/payroll-run.entity';
import { PayrollEmployee } from '../../payroll/entity/payroll-employee.entity';
import { PayrollLine } from '../../payroll/entity/payroll-line.entity';
import { HrJob } from '../../payroll/entity/hr-job.entity';

export {
  OrganizationSettings as HrOrganizationSettings, MasterData as HrMasterData, AuditEvent as HrAuditEvent,
  EmployeeEmploymentHistory, Shift, RosterAssignment, AttendanceIntegrationCredential, AttendancePunch,
  AttendanceDay, AttendanceCorrection, OvertimeRequest, LeaveBalance, LeaveRequest, SalaryStructure,
  SalaryStructureComponent, EmployeeSalaryAssignment, EmployeePayrollOpening, EmployeeLoan,
  LoanInstallment, StatutoryRulePack, PayrollRun, PayrollEmployee, PayrollLine, HrJob,
};

export const HR_PAYROLL_ENTITIES = [
  MasterData, OrganizationSettings, AuditEvent, EmployeeEmploymentHistory, Shift, RosterAssignment,
  AttendanceIntegrationCredential, AttendancePunch, AttendanceDay, AttendanceCorrection, OvertimeRequest,
  LeaveBalance, LeaveRequest, SalaryStructure, SalaryStructureComponent, EmployeeSalaryAssignment,
  EmployeePayrollOpening, EmployeeLoan, LoanInstallment, StatutoryRulePack, PayrollRun, PayrollEmployee,
  PayrollLine, HrJob,
];
