import { ConflictException, ForbiddenException } from '@nestjs/common';
import { PayrollRunStatus } from '../common/hr.enums';
import { PayrollWorkflowService } from './payroll-workflow.service';

describe('PayrollWorkflowService', () => {
  const service = new PayrollWorkflowService();
  const actors = { preparedById: 'maker', reviewedById: 'reviewer' };

  it('allows the production workflow and rejection path', () => {
    expect(() => service.assertTransition(PayrollRunStatus.Prepared, PayrollRunStatus.UnderReview, 'reviewer', actors)).not.toThrow();
    expect(() => service.assertTransition(PayrollRunStatus.UnderReview, PayrollRunStatus.Approved, 'approver', actors)).not.toThrow();
    expect(() => service.assertTransition(PayrollRunStatus.Approved, PayrollRunStatus.Prepared, 'approver', actors)).not.toThrow();
  });

  it('enforces state and separation of duties', () => {
    expect(() => service.assertTransition(PayrollRunStatus.Locked, PayrollRunStatus.Prepared, 'admin', actors)).toThrow(ConflictException);
    expect(() => service.assertTransition(PayrollRunStatus.Prepared, PayrollRunStatus.UnderReview, 'maker', actors)).toThrow(ForbiddenException);
    expect(() => service.assertTransition(PayrollRunStatus.UnderReview, PayrollRunStatus.Approved, 'reviewer', actors)).toThrow(ForbiddenException);
  });
});
