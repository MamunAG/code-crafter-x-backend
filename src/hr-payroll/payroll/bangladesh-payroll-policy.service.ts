import { BadRequestException, Injectable } from '@nestjs/common';

export type TaxBracket = { upto?: number | null; rate: number };
export type BangladeshTaxRules = {
  annualTaxFreeThreshold: number;
  brackets: TaxBracket[];
  minimumTax?: number;
  monthlyRounding?: number;
};

@Injectable()
export class BangladeshPayrollPolicyService {
  calculateAnnualTax(taxableIncome: number, rules: BangladeshTaxRules) {
    if (taxableIncome <= 0) return 0;
    this.validateTaxRules(rules);
    let remaining = Math.max(0, taxableIncome - rules.annualTaxFreeThreshold);
    let tax = 0;
    for (const bracket of rules.brackets) {
      if (remaining <= 0) break;
      const taxable = bracket.upto == null ? remaining : Math.min(remaining, bracket.upto);
      tax += taxable * bracket.rate;
      remaining -= taxable;
    }
    if (tax > 0 && rules.minimumTax) tax = Math.max(tax, rules.minimumTax);
    return this.round(tax, rules.monthlyRounding ?? 2);
  }

  calculateMonthlyWithholding(projectedAnnualTaxableIncome: number, taxAlreadyWithheld: number, remainingPeriods: number, rules: BangladeshTaxRules) {
    if (remainingPeriods < 1) throw new BadRequestException('Remaining payroll periods must be at least one.');
    const annualTax = this.calculateAnnualTax(projectedAnnualTaxableIncome, rules);
    return Math.max(0, this.round((annualTax - taxAlreadyWithheld) / remainingPeriods, rules.monthlyRounding ?? 2));
  }

  calculateOvertime(ordinaryMonthlyWage: number, overtimeMinutes: number, monthlyHours: number, multiplier = 2, precision = 2) {
    if (ordinaryMonthlyWage < 0 || overtimeMinutes < 0 || monthlyHours <= 0 || multiplier < 0) throw new BadRequestException('Invalid overtime inputs.');
    return this.round((ordinaryMonthlyWage / monthlyHours) * (overtimeMinutes / 60) * multiplier, precision);
  }

  prorate(amount: number, payableDays: number, divisorDays: number, precision = 2) {
    if (divisorDays <= 0 || payableDays < 0) throw new BadRequestException('Invalid proration inputs.');
    return this.round(amount * Math.min(payableDays, divisorDays) / divisorDays, precision);
  }

  private validateTaxRules(rules: BangladeshTaxRules) {
    if (!rules || rules.annualTaxFreeThreshold < 0 || !rules.brackets?.length) throw new BadRequestException('Tax rule pack is incomplete.');
    for (const bracket of rules.brackets) {
      if (bracket.rate < 0 || bracket.rate > 1 || (bracket.upto != null && bracket.upto <= 0)) throw new BadRequestException('Tax rule pack contains an invalid bracket.');
    }
    if (rules.brackets[rules.brackets.length - 1].upto != null) throw new BadRequestException('The final tax bracket must cover the remaining income.');
  }

  private round(value: number, precision: number) {
    const factor = 10 ** precision;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }
}
