import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, formatPrice, getStockLevel, gradientFor, hasActiveFilters } from './format';

describe('format utils', () => {
  it('formats prices as whole-dollar currency', () => expect(formatPrice(28500)).toBe('$28,500'));
  it.each([[0, 'out'], [1, 'low'], [3, 'low'], [4, 'in'], [50, 'in']] as const)('stock level for %i is %s', (qty, level) => {
    expect(getStockLevel(qty)).toBe(level);
  });
  it('detects active filters', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, make: 'ford' })).toBe(true);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, make: '   ' })).toBe(false);
  });
  it('falls back to a neutral gradient for unknown categories', () => {
    expect(gradientFor('SUV')).toContain('emerald');
    expect(gradientFor('Hovercraft')).toContain('slate');
  });
});
