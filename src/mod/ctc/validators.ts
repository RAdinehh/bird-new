/**
 * validators.ts — اعتبارسنجی شماره کارت، شبا، حساب
 *
 * الگوریتم‌ها:
 * - شماره کارت: Luhn (ISO/IEC 7812) — همه کارت‌های شتاب این رو رعایت می‌کنن
 * - شبا: MOD-97-10 (ISO 13616) — IBAN ایران
 * - شماره حساب: فقط طول (۱۰-۲۰) — الگوریتم ریاضی نداره
 */
import { toFa } from '../../shr/utils/fa';

export type ValidationState = 'empty' | 'partial' | 'invalid' | 'valid';
export interface ValidationResult {
  state: ValidationState;
  message?: string;
}

// ═══════════════════════════════════════════
// Luhn (ISO/IEC 7812) — شماره کارت
// ═══════════════════════════════════════════
export function isValidCardNumber(card: string): boolean {
  const digits = card.replace(/\D/g, '');
  if (digits.length !== 16) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardValidation(card: string): ValidationResult {
  const digits = (card || '').replace(/\D/g, '');
  if (digits.length === 0) return { state: 'empty' };
  if (digits.length < 16) return { state: 'partial', message: `${toFa(digits.length)}/۱۶ رقم` };
  if (digits.length === 16) {
    if (isValidCardNumber(digits)) return { state: 'valid' };
    return { state: 'invalid', message: 'شماره کارت معتبر نیست (Luhn)' };
  }
  return { state: 'invalid', message: 'شماره کارت باید ۱۶ رقم باشد' };
}

// ═══════════════════════════════════════════
// MOD-97-10 (ISO 13616) — شبا
// ═══════════════════════════════════════════
export function isValidShaba(shaba: string): boolean {
  const clean = (shaba || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!clean.startsWith('IR')) return false;
  if (clean.length !== 26) return false;
  const rearranged = clean.slice(4) + clean.slice(0, 4);
  let numeric = '';
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) numeric += String(code - 55);
    else numeric += ch;
  }
  let remainder = 0;
  for (const ch of numeric) {
    remainder = (remainder * 10 + parseInt(ch, 10)) % 97;
  }
  return remainder === 1;
}

export function shabaValidation(shaba: string): ValidationResult {
  const clean = (shaba || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (clean.length === 0) return { state: 'empty' };
  if (!clean.startsWith('IR')) return { state: 'invalid', message: 'شبا باید با IR شروع شود' };
  if (clean.length < 26) return { state: 'partial', message: `${toFa(clean.length)}/۲۶ کاراکتر` };
  if (clean.length === 26) {
    if (isValidShaba(clean)) return { state: 'valid' };
    return { state: 'invalid', message: 'شماره شبا معتبر نیست (MOD-97)' };
  }
  return { state: 'invalid', message: 'شماره شبا باید ۲۶ کاراکتر باشد' };
}

// ═══════════════════════════════════════════
// شماره حساب — فقط طول
// ═══════════════════════════════════════════
export function isValidAccountNumber(account: string): boolean {
  const digits = (account || '').replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 20;
}

export function accountValidation(account: string): ValidationResult {
  const digits = (account || '').replace(/\D/g, '');
  if (digits.length === 0) return { state: 'empty' };
  if (digits.length < 10) return { state: 'partial', message: `${toFa(digits.length)}/۱۰ رقم` };
  if (digits.length <= 20) return { state: 'valid' };
  return { state: 'invalid', message: 'شماره حساب حداکثر ۲۰ رقم است' };
}
