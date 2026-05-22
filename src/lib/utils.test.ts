import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatRelativeTime, getInitials } from './utils';

describe('formatCurrency', () => {
  it('formats positive values as BRL', () => {
    expect(formatCurrency(1500)).toMatch(/1\.500,00/);
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toMatch(/0,00/);
  });

  it('formats values with cents', () => {
    expect(formatCurrency(1234.56)).toMatch(/1\.234,56/);
  });
});

describe('formatDate', () => {
  it('formats ISO date to dd/mm/yyyy', () => {
    expect(formatDate('2026-03-15T12:00:00.000Z')).toMatch(/15\/03\/2026/);
  });

  it('returns — for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});

describe('formatRelativeTime', () => {
  it('returns — for invalid date', () => {
    expect(formatRelativeTime('bad')).toBe('—');
  });

  it('returns "Agora" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatRelativeTime(now)).toBe('Agora');
  });

  it('returns minutes for recent timestamps', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5min atrás');
  });

  it('returns hours for same-day timestamps', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h atrás');
  });

  it('returns "Ontem" for 25-hour-old timestamps', () => {
    const yesterday = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    expect(formatRelativeTime(yesterday)).toBe('Ontem');
  });
});

describe('getInitials', () => {
  it('returns first two initials', () => {
    expect(getInitials('João Silva')).toBe('JS');
  });

  it('returns single initial for single-word names', () => {
    expect(getInitials('Lucas')).toBe('L');
  });

  it('returns ? for empty string', () => {
    expect(getInitials('')).toBe('?');
  });

  it('returns ? for whitespace-only string', () => {
    expect(getInitials('   ')).toBe('?');
  });

  it('handles undefined gracefully', () => {
    expect(getInitials(undefined as unknown as string)).toBe('?');
  });

  it('uppercases the result', () => {
    expect(getInitials('maria joana')).toBe('MJ');
  });
});
