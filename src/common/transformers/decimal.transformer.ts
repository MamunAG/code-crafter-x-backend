import { ValueTransformer } from 'typeorm';

/**
 * Transforms decimal values from PostgreSQL to numbers
 * PostgreSQL returns decimal types as strings, so we need to convert them to numbers
 */
export class DecimalTransformer implements ValueTransformer {
  /**
   * Transforms the value before saving to database (no change needed)
   */
  to(value: number | null): number | null {
    return value;
  }

  /**
   * Transforms the value after loading from database (converts string to number)
   */
  from(value: string | number | null | undefined): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    // If it's already a number, return as is
    if (typeof value === 'number') {
      return value;
    }

    // If it's a string, convert to number
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    }

    return null;
  }
}
