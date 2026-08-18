import { BangladeshPayrollPolicyService } from './bangladesh-payroll-policy.service';

describe('BangladeshPayrollPolicyService', () => {
  const service = new BangladeshPayrollPolicyService();
  const rules = {
    annualTaxFreeThreshold: 375000,
    brackets: [
      { upto: 300000, rate: 0.10 }, { upto: 400000, rate: 0.15 }, { upto: 500000, rate: 0.20 },
      { upto: 2000000, rate: 0.25 }, { upto: null, rate: 0.30 },
    ],
  };

  it('calculates progressive annual tax without mutating the rules', () => {
    expect(service.calculateAnnualTax(1075000, rules)).toBe(90000);
    expect(rules.brackets[0].upto).toBe(300000);
  });

  it('calculates remaining-period withholding and payroll primitives', () => {
    expect(service.calculateMonthlyWithholding(1075000, 30000, 6, rules)).toBe(10000);
    expect(service.prorate(30000, 15, 30)).toBe(15000);
    expect(service.calculateOvertime(10000, 120, 200)).toBe(200);
  });
});
