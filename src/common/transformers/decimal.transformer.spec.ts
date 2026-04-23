import { DecimalTransformer } from './decimal.transformer';

describe('DecimalTransformer', () => {
  let transformer: DecimalTransformer;

  beforeEach(() => {
    transformer = new DecimalTransformer();
  });

  describe('to', () => {
    it('should return the same number value when saving to database', () => {
      expect(transformer.to(100.5)).toBe(100.5);
      expect(transformer.to(0)).toBe(0);
      expect(transformer.to(null)).toBe(null);
    });
  });

  describe('from', () => {
    it('should convert string decimal values to numbers when reading from database', () => {
      expect(transformer.from('100.50')).toBe(100.5);
      expect(transformer.from('0.00')).toBe(0);
      expect(transformer.from('15000.00')).toBe(15000);
      expect(transformer.from('500.00')).toBe(500);
      expect(transformer.from('15.00')).toBe(15);
    });

    it('should return the same number value if already a number', () => {
      expect(transformer.from(100.5)).toBe(100.5);
      expect(transformer.from(0)).toBe(0);
      expect(transformer.from(15000)).toBe(15000);
    });

    it('should return null for invalid string values', () => {
      expect(transformer.from('invalid')).toBe(null);
      expect(transformer.from('')).toBe(null);
    });

    it('should return null for null/undefined values', () => {
      expect(transformer.from(null)).toBe(null);
      expect(transformer.from(undefined)).toBe(null);
    });
  });
});
