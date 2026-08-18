import { BadRequestException } from '@nestjs/common';
import { FormulaEngineService } from './formula-engine.service';

describe('FormulaEngineService', () => {
  const service = new FormulaEngineService();

  it('evaluates whitelisted payroll formulas with a trace', () => {
    const result = service.evaluate('ROUND(BASE * 0.4 + IF(OT_HOURS > 2, OT_HOURS * 50, 0), 2)', {
      BASE: 10000,
      OT_HOURS: 3,
    });
    expect(result.value).toBe(4150);
    expect(result.trace.variables).toEqual({ BASE: 10000, OT_HOURS: 3 });
  });

  it('orders dependent components', () => {
    const ordered = service.orderDefinitions([
      { code: 'GROSS', formula: 'BASIC + HOUSE' },
      { code: 'HOUSE', formula: 'BASIC * 0.5' },
      { code: 'BASIC', formula: 'BASE' },
    ], ['BASE']);
    expect(ordered.map((item) => item.code)).toEqual(['BASIC', 'HOUSE', 'GROSS']);
  });

  it('rejects circular dependencies and unsafe syntax', () => {
    expect(() => service.orderDefinitions([
      { code: 'A', formula: 'B + 1' },
      { code: 'B', formula: 'A + 1' },
    ])).toThrow(BadRequestException);
    expect(() => service.evaluate('process.exit()', {})).toThrow(BadRequestException);
  });

  it('calculates a deterministic 10,000-employee fixture', () => {
    const calculate = () => Array.from({ length: 10_000 }, (_, index) =>
      service.evaluate('ROUND(BASE * 0.6 + MAX(OT_HOURS * 100, 0), 2)', {
        BASE: 12_000 + index,
        OT_HOURS: index % 12,
      }).value,
    );

    const first = calculate();
    const second = calculate();
    expect(first).toHaveLength(10_000);
    expect(second).toEqual(first);
  });
});
