import { describe, it, expect } from 'vitest';
import { createContactSchema } from '../shr/validation/rules/ctc';

const schema = createContactSchema();
const valid = {
  name: 'علی رضایی',
  roles: ['customer'],
  phone: '09121234567',
  landline: '',
  nationalCode: '',
  province: '',
  city: '',
  address: '',
  bankName: '',
  cardNumber: '',
  iban: '',
  creditLimit: '',
  notes: '',
};

function check(overrides: Record<string, unknown>) {
  return schema.safeParse({ ...valid, ...overrides });
}

describe('createContactSchema (L11)', () => {
  it('valid input passes', () => {
    expect(check({}).success).toBe(true);
  });

  it('name required', () => {
    const r = check({ name: '' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'name')).toBe(true);
  });

  it('name too short (<2)', () => {
    const r = check({ name: 'a' });
    expect(r.success).toBe(false);
  });

  it('name too long (>100)', () => {
    const r = check({ name: 'x'.repeat(101) });
    expect(r.success).toBe(false);
  });

  it('name trims whitespace', () => {
    const r = check({ name: '  علی  ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe('علی');
  });

  it('roles required (empty array)', () => {
    const r = check({ roles: [] });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some(i => i.path[0] === 'roles')).toBe(true);
  });

  it('invalid role', () => {
    expect(check({ roles: ['admin'] }).success).toBe(false);
  });

  it('multiple roles OK', () => {
    expect(check({ roles: ['customer', 'supplier'] }).success).toBe(true);
  });

  it('phone: valid Iranian mobile', () => {
    expect(check({ phone: '09121234567' }).success).toBe(true);
  });

  it('phone: invalid prefix', () => {
    expect(check({ phone: '08121234567' }).success).toBe(false);
  });

  it('phone: too short', () => {
    expect(check({ phone: '0912123456' }).success).toBe(false);
  });

  it('phone: empty allowed', () => {
    expect(check({ phone: '' }).success).toBe(true);
  });

  it('phone: undefined allowed', () => {
    expect(check({ phone: undefined }).success).toBe(true);
  });

  it('nationalCode: empty allowed', () => {
    expect(check({ nationalCode: '' }).success).toBe(true);
  });

  it('nationalCode: 10 digits', () => {
    expect(check({ nationalCode: '1234567890' }).success).toBe(true);
  });

  it('nationalCode: 9 digits rejected', () => {
    expect(check({ nationalCode: '123456789' }).success).toBe(false);
  });

  it('nationalCode: 11 digits rejected', () => {
    expect(check({ nationalCode: '12345678901' }).success).toBe(false);
  });

  it('cardNumber: empty allowed', () => {
    expect(check({ cardNumber: '' }).success).toBe(true);
  });

  it('cardNumber: 16 digits', () => {
    expect(check({ cardNumber: '1234567812345678' }).success).toBe(true);
  });

  it('cardNumber: 15 digits rejected', () => {
    expect(check({ cardNumber: '123456781234567' }).success).toBe(false);
  });

  it('iban: empty allowed', () => {
    expect(check({ iban: '' }).success).toBe(true);
  });

  it('iban: valid IR + 24 digits', () => {
    expect(check({ iban: 'IR' + '0'.repeat(24) }).success).toBe(true);
  });

  it('iban: missing IR rejected', () => {
    expect(check({ iban: '0'.repeat(26) }).success).toBe(false);
  });

  it('iban: too short rejected', () => {
    expect(check({ iban: 'IR123' }).success).toBe(false);
  });

  it('creditLimit: empty → 0', () => {
    const r = check({ creditLimit: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.creditLimit).toBe(0);
  });

  it('creditLimit: numeric string coerced', () => {
    const r = check({ creditLimit: '500000' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.creditLimit).toBe(500000);
  });

  it('creditLimit: negative rejected', () => {
    expect(check({ creditLimit: -1 }).success).toBe(false);
  });

  it('notes: too long rejected (>1000)', () => {
    expect(check({ notes: 'x'.repeat(1001) }).success).toBe(false);
  });

  it('notes: empty OK', () => {
    expect(check({ notes: '' }).success).toBe(true);
  });

  it('all optional fields absent still passes', () => {
    const minimal = {
      name: 'رضا',
      roles: ['worker'],
    };
    expect(schema.safeParse(minimal).success).toBe(true);
  });
});
