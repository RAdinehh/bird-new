import { BANKS, ROLE_LABEL, type Person, type Role } from './store';
import { toFa } from '../../shr/utils/fa';

function group4(digits: string): string {
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

export function formatPhone(p: string): string {
  return toFa(p || '');
}

export function formatCard(c: string): string {
  if (!c) return '';
  return toFa(group4(c));
}

export function formatShaba(s: string): string {
  if (!s) return '';
  const withIR = s.startsWith('IR') ? s : `IR${s}`;
  return group4(withIR);
}

export function formatContactSection(p: Person): string {
  const lines: string[] = [];
  if (p.phone) lines.push(`📞 تلفن: ${formatPhone(p.phone)}`);
  if (p.phone2) lines.push(`📞 تلفن دوم: ${formatPhone(p.phone2)}`);
  if (p.email) lines.push(`📧 ایمیل: ${p.email}`);
  return lines.join('\n');
}

export function formatAddressSection(p: Person): string {
  const lines: string[] = [];
  if (p.city) lines.push(`📍 شهر: ${p.city}`);
  if (p.address) lines.push(`📍 آدرس: ${p.address}`);
  return lines.join('\n');
}

export function formatBankSection(p: Person): string {
  const bk = p.bankAccount;
  if (!bk) return '';
  const lines: string[] = [];
  if (bk.bank) {
    const bank = BANKS.find(b => b.key === bk.bank);
    lines.push(`🏦 بانک: ${bank?.label || bk.bank}`);
  }
  if (bk.accountHolder) lines.push(`👤 صاحب حساب: ${bk.accountHolder}`);
  if (bk.cardNumber) lines.push(`💳 کارت: ${formatCard(bk.cardNumber)}`);
  if (bk.accountNumber) lines.push(`🔢 حساب: ${toFa(bk.accountNumber)}`);
  if (bk.shaba) lines.push(`🔗 شبا: ${formatShaba(bk.shaba)}`);
  return lines.join('\n');
}

export function formatNationalId(p: Person): string {
  return p.nationalId ? `🆔 کد ملی: ${toFa(p.nationalId)}` : '';
}

export function formatNotes(p: Person): string {
  return p.notes ? `📝 ${p.notes}` : '';
}

export function formatFullContact(p: Person): string {
  const lines: string[] = [];
  const prefix = p.gender === 'male' ? 'جناب آقای' : p.gender === 'female' ? 'سرکار خانم' : '';
  lines.push(`👤 ${prefix} ${p.name}`.replace(/\s+/g, ' ').trim());
  lines.push('────────────────');

  const contact = formatContactSection(p);
  if (contact) lines.push(contact);

  const addr = formatAddressSection(p);
  if (addr) lines.push(addr);

  const nid = formatNationalId(p);
  if (nid) lines.push(nid);

  const bank = formatBankSection(p);
  if (bank) {
    lines.push('────────────────');
    lines.push(bank);
  }

  if (p.roles.length > 0) {
    lines.push('────────────────');
    lines.push(`🎭 ${p.roles.map(r => ROLE_LABEL[r as Role] || r).join('، ')}`);
  }

  const notes = formatNotes(p);
  if (notes) {
    lines.push('────────────────');
    lines.push(notes);
  }

  return lines.join('\n');
}
