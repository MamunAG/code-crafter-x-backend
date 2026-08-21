export enum HrMasterDataType {
  EmploymentType = 'EMPLOYMENT_TYPE',
  Grade = 'GRADE',
  PayGroup = 'PAY_GROUP',
  WorkLocation = 'WORK_LOCATION',
  HolidayCalendar = 'HOLIDAY_CALENDAR',
  LeaveType = 'LEAVE_TYPE',
  LeavePolicy = 'LEAVE_POLICY',
  LeavePolicyAssignment = 'LEAVE_POLICY_ASSIGNMENT',
  LeaveWorkflow = 'LEAVE_WORKFLOW',
  LeaveWorkflowAssignment = 'LEAVE_WORKFLOW_ASSIGNMENT',
  SalaryComponent = 'SALARY_COMPONENT',
  SeparationReason = 'SEPARATION_REASON',
}

export enum EmployeeLifecycleAction {
  Activate = 'ACTIVATE',
  Transfer = 'TRANSFER',
  Promote = 'PROMOTE',
  Confirm = 'CONFIRM',
  Suspend = 'SUSPEND',
  Resign = 'RESIGN',
  Terminate = 'TERMINATE',
  Retire = 'RETIRE',
  Rehire = 'REHIRE',
}

export enum AttendanceDirection {
  In = 'IN',
  Out = 'OUT',
  Unknown = 'UNKNOWN',
}

export enum AttendanceStatus {
  Present = 'PRESENT',
  Absent = 'ABSENT',
  Leave = 'LEAVE',
  Holiday = 'HOLIDAY',
  WeeklyOff = 'WEEKLY_OFF',
  MissingPunch = 'MISSING_PUNCH',
}

export enum ApprovalStatus {
  Draft = 'DRAFT',
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Returned = 'RETURNED',
  Cancelled = 'CANCELLED',
}

export enum PayrollFrequency {
  Weekly = 'WEEKLY',
  Biweekly = 'BIWEEKLY',
  Semimonthly = 'SEMIMONTHLY',
  Monthly = 'MONTHLY',
}

export enum PayrollProcessingMode {
  Individual = 'INDIVIDUAL',
  Bulk = 'BULK',
}

export enum PayrollRunType {
  Regular = 'REGULAR',
  Bonus = 'BONUS',
  Arrears = 'ARREARS',
  Adjustment = 'ADJUSTMENT',
  FinalSettlement = 'FINAL_SETTLEMENT',
  Reversal = 'REVERSAL',
}

export enum PayrollRunStatus {
  Draft = 'DRAFT',
  Calculating = 'CALCULATING',
  Prepared = 'PREPARED',
  UnderReview = 'UNDER_REVIEW',
  Approved = 'APPROVED',
  Locked = 'LOCKED',
  Failed = 'FAILED',
  Reversed = 'REVERSED',
}

export enum PayrollComponentType {
  Earning = 'EARNING',
  Deduction = 'DEDUCTION',
  EmployerContribution = 'EMPLOYER_CONTRIBUTION',
  Informational = 'INFORMATIONAL',
}

export enum HrJobStatus {
  Queued = 'QUEUED',
  Running = 'RUNNING',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
}

export enum LoanStatus {
  Draft = 'DRAFT',
  Approved = 'APPROVED',
  Active = 'ACTIVE',
  Paused = 'PAUSED',
  Settled = 'SETTLED',
  Cancelled = 'CANCELLED',
}
