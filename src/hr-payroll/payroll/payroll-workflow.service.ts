import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { PayrollRunStatus } from '../common/hr.enums';

export type PayrollActors = { preparedById?: string | null; reviewedById?: string | null; approvedById?: string | null };

@Injectable()
export class PayrollWorkflowService {
  assertTransition(from: PayrollRunStatus, to: PayrollRunStatus, actorId: string, actors: PayrollActors) {
    const allowed: Partial<Record<PayrollRunStatus, PayrollRunStatus[]>> = {
      [PayrollRunStatus.Draft]: [PayrollRunStatus.Calculating],
      [PayrollRunStatus.Failed]: [PayrollRunStatus.Calculating],
      [PayrollRunStatus.Calculating]: [PayrollRunStatus.Prepared, PayrollRunStatus.Failed],
      [PayrollRunStatus.Prepared]: [PayrollRunStatus.UnderReview],
      [PayrollRunStatus.UnderReview]: [PayrollRunStatus.Approved, PayrollRunStatus.Prepared],
      [PayrollRunStatus.Approved]: [PayrollRunStatus.Locked, PayrollRunStatus.Prepared],
    };
    if (!(allowed[from] ?? []).includes(to)) throw new ConflictException(`Payroll cannot transition from ${from} to ${to}.`);
    if (to === PayrollRunStatus.UnderReview && actors.preparedById === actorId) throw new ForbiddenException('The payroll preparer cannot act as reviewer.');
    if (to === PayrollRunStatus.Approved && [actors.preparedById, actors.reviewedById].includes(actorId)) throw new ForbiddenException('Payroll approval requires a third user distinct from preparer and reviewer.');
  }
}
