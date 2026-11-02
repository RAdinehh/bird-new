import { describe, it, expect } from 'vitest';
import {
  isValidCardNumber, cardValidation,
  isValidShaba, shabaValidation,
  isValidAccountNumber, accountValidation,
} from '../mod/ctc/validators';
import { formatPhone, formatCard, formatShaba } from '../mod/ctc/format';

// ─── Luhn / ISO 7812 ───
describe('isValidCardNumber', () => {
  it('known-valid Visa test card', () => {
    expect(isValidCardNumber('4111 1111 1111 1111')).toBe(true);
  });
  it('invalid check digit', () => {
    expect(isValidCardNumber('4111 1111 1111 1112')).toBe(false);
  });
  it('15 digits → false', () => {
    expect(isValidCardNumber('411111111111111')).toBe(false);
  });
  it('17 digits → false', () => {
    expect(isValidCardNumber('41111111111111111')).toBe(false);
  });
  it('with dashes', () => {
    expect(isValidCardNumber('4111-1111-1111-1111')).toBe(true);
  });
  it('Persian digits', () => {
    expect(isValidCardNumber('۴۱۱۱۱۱۱۱۱۱۱۱۱۱۱۱')).toBe(true);
  });
});

describe('cardValidation', () => {
  it('empty → empty', () => {
    expect(cardValidation('').state).toBe('empty');
  });
  it('partial with count', () => {
    const r = cardValidation('4111111');
    expect(r.state).toBe('partial');
    expect(r.message).toContain('/۱۶');
  });
  it('valid', () => {
    expect(cardValidation('4111 1111 1111 1111').state).toBe('valid');
  });
  it('16 digits bad luhn → invalid', () => {
    expect(cardValidation('4111 1111 1111 1112').state).toBe('invalid');
  });
  it('>16 digits → invalid', () => {
    expect(cardValidation('41111111111111111').state).toBe('invalid');
  });
});

// ─── MOD-97 / ISO 13616 ───
describe('isValidShaba', () => {
  it('valid Iranian IBAN', () => {
    expect(isValidShaba('IR062960000000100324200001')).toBe(true);
  });
  it('non-IR → false', () => {
    expect(isValidShaba('DE89370400440532013000')).toBe(false);
  });
  it('too short → false', () => {
    expect(isValidShaba('IR123')).toBe(false);
  });
  it('26 chars but bad checksum → false', () => {
    expect(isValidShaba('IR000000000000000000000000')).toBe(false);
  });
});

describe('shabaValidation', () => {
  it('empty → empty', () => {
    expect(shabaValidation('').state).toBe('empty');
  });
  it('without IR → invalid', () => {
    expect(shabaValidation('2960000000100324200001').state).toBe('invalid');
  });
  it('partial with count', () => {
    const r = shabaValidation('IR123');
    expect(r.state).toBe('partial');
    expect(r.message).toContain('/۲۶');
  });
  it('valid', () => {
    expect(shabaValidation('IR062960000000100324200001').state).toBe('valid');
  });
  it('bad checksum → invalid', () => {
    expect(shabaValidation('IR000000000000000000000000').state).toBe('invalid');
  });
});

// ─── Account (length only) ───
describe('isValidAccountNumber', () => {
  it('10 digits → true', () => { expect(isValidAccountNumber('1234567890')).toBe(true); });
  it('20 digits → true', () => { expect(isValidAccountNumber('12345678901234567890')).toBe(true); });
  it('9 digits → false', () => { expect(isValidAccountNumber('123456789')).toBe(false); });
  it('21 digits → false', () => { expect(isValidAccountNumber('123456789012345678901')).toBe(false); });
  it('Persian digits', () => { expect(isValidAccountNumber('۱۲۳۴۵۶۷۸۹۰')).toBe(true); });
});

describe('accountValidation', () => {
  it('empty → empty', () => { expect(accountValidation('').state).toBe('empty'); });
  it('partial with count', () => {
    const r = accountValidation('12345');
    expect(r.state).toBe('partial');
    expect(r.message).toContain('/۱۰');
  });
  it('valid', () => { expect(accountValidation('1234567890').state).toBe('valid'); });
  it('over max → invalid', () => { expect(accountValidation('123456789012345678901').state).toBe('invalid'); });
});

// ─── format ───
describe('format (ctc)', () => {
  it('formatPhone → Persian', () => {
    expect(formatPhone('09121234567')).toBe('۰۹۱۲۱۲۳۴۵۶۷');
  });
  it('formatPhone empty → empty', () => {
    expect(formatPhone('')).toBe('');
  });
  it('formatCard → groups of 4 with Persian', () => {
    expect(formatCard('4111111111111111')).toBe('۴۱۱۱ ۱۱۱۱ ۱۱۱۱ ۱۱۱۱');
  });
  it('formatCard empty → empty', () => {
    expect(formatCard('')).toBe('');
  });
  it('formatShaba adds IR', () => {
    expect(formatShaba('062960000000100324200001')).toBe('IR06 2960 0000 0010 0324 2000 01');
  });
  it('formatShaba keeps IR', () => {
    expect(formatShaba('IR062960000000100324200001')).toBe('IR06 2960 0000 0010 0324 2000 01');
  });
  it('formatShaba empty → empty', () => {
    expect(formatShaba('')).toBe('');
  });
});
