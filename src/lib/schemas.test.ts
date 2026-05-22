import { describe, it, expect } from 'vitest';
import {
  PropertySchema,
  TenantSchema,
  PaymentSchema,
  LoginSchema,
} from './schemas';

describe('PropertySchema', () => {
  const valid = {
    name: 'Apto 101',
    address: 'Rua das Flores 10',
    city: 'São Paulo',
    type: 'apartment',
    status: 'vacant',
    rentAmount: 2500,
    area: 75,
    amenities: ['elevator', 'pool'],
    occupancyRate: 0,
  };

  it('accepts valid property', () => {
    expect(PropertySchema.safeParse(valid).success).toBe(true);
  });

  it('rejects negative rentAmount', () => {
    const r = PropertySchema.safeParse({ ...valid, rentAmount: -100 });
    expect(r.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const r = PropertySchema.safeParse({ ...valid, type: 'castle' });
    expect(r.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const r = PropertySchema.safeParse({ name: 'Only Name' });
    expect(r.success).toBe(false);
  });

  it('rejects occupancyRate > 100', () => {
    const r = PropertySchema.safeParse({ ...valid, occupancyRate: 150 });
    expect(r.success).toBe(false);
  });
});

describe('TenantSchema', () => {
  const valid = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '11999999999',
    cpf: '123.456.789-09',
    score: 850,
    joinedAt: '2026-01-15T00:00:00.000Z',
    paymentHistory: ['paid', 'paid'],
    status: 'active',
  };

  it('accepts valid tenant', () => {
    expect(TenantSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    const r = TenantSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('accepts empty email', () => {
    const r = TenantSchema.safeParse({ ...valid, email: '' });
    expect(r.success).toBe(true);
  });

  it('accepts unformatted CPF digits', () => {
    const r = TenantSchema.safeParse({ ...valid, cpf: '12345678909' });
    expect(r.success).toBe(true);
  });

  it('rejects CPF shorter than 11 chars', () => {
    const r = TenantSchema.safeParse({ ...valid, cpf: '1234' });
    expect(r.success).toBe(false);
  });

  it('rejects score > 1000', () => {
    const r = TenantSchema.safeParse({ ...valid, score: 1001 });
    expect(r.success).toBe(false);
  });
});

describe('PaymentSchema', () => {
  const valid = {
    tenantId: 'tenant-1',
    propertyId: 'prop-1',
    contractId: 'contract-1',
    amount: 2000,
    dueDate: '2026-04-05T00:00:00.000Z',
    status: 'pending',
    month: '2026-04',
    description: 'Aluguel de abril',
  };

  it('accepts valid payment', () => {
    expect(PaymentSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid month format', () => {
    const r = PaymentSchema.safeParse({ ...valid, month: 'April 2026' });
    expect(r.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const r = PaymentSchema.safeParse({ ...valid, amount: 0 });
    expect(r.success).toBe(false);
  });
});

describe('LoginSchema', () => {
  it('accepts valid credentials', () => {
    expect(LoginSchema.safeParse({ email: 'user@x.com', password: 'secure123' }).success).toBe(true);
  });

  it('rejects short password', () => {
    const r = LoginSchema.safeParse({ email: 'user@x.com', password: '123' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const r = LoginSchema.safeParse({ email: 'not-email', password: 'secure123' });
    expect(r.success).toBe(false);
  });
});
