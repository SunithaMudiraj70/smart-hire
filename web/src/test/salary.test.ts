import { describe, it, expect } from 'vitest';
import { formatSalary } from '../lib/salary';

describe('formatSalary', () => {
  it('hides placeholder strings', () => {
    expect(formatSalary('Competitive')).toBeNull();
    expect(formatSalary('competitive')).toBeNull();
    expect(formatSalary('Market Standard')).toBeNull();
    expect(formatSalary('Not disclosed')).toBeNull();
    expect(formatSalary('₹0')).toBeNull();
    expect(formatSalary('$0')).toBeNull();
    expect(formatSalary(null)).toBeNull();
    expect(formatSalary(undefined)).toBeNull();
    expect(formatSalary('')).toBeNull();
  });

  it('preserves genuine salary ranges', () => {
    expect(formatSalary('₹12,00,000 - ₹18,00,000 a year')).toBe('₹12,00,000 - ₹18,00,000 a year');
    expect(formatSalary('$80,000 - $120,000')).toBe('$80,000 - $120,000');
    expect(formatSalary('₹30,000 / month stipend')).toBe('₹30,000 / month stipend');
  });
});

