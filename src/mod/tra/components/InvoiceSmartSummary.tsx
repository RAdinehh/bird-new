/**
 * InvoiceSmartSummary.tsx — خلاصه‌ی پیش‌بینی عملیات فاکتور
 *
 * قبل از ذخیره، به کاربر می‌گه دقیقاً چه چیزی ساخته می‌شه:
 * - چند گله جدید
 * - چند حرکت انبار
 * - چند بچ جوجه‌کشی
 * - تعداد و مبلغ اقساط (اگر قسطی)
 * - مبلغ پرداخت‌شده
 * - اقلام نزدیک انقضا (⚠️)
 *
 * اگر هیچ عملیاتی در پیش نباشه، null برمی‌گردونه (کاملاً مخفی).
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import { daysToExpiry } from '../../whs/store';
import type { F } from '../types-invoice';

interface Props {
  form: F;
  total: number;
  paid: number;
}

const BIRD_CATS = ['chick', 'adult'];
const WH_CATS = ['feed', 'medicine', 'equipment'];
const EXPIRY_THRESHOLD_DAYS = 60;

export default function InvoiceSmartSummary({ form, total, paid }: Props) {
  // ─── محاسبات ───
  const flockCount = form.items.filter(it => {
    const cat = it.category || form.category;
    return BIRD_CATS.includes(cat) && (it.breedId || it.birdId) && !it.flockId;
  }).length;

  const warehouseCount = form.items.filter(it => {
    const cat = it.category || form.category;
    return WH_CATS.includes(cat) && it.itemId;
  }).length;

  const incubationCount = form.items.filter(it => {
    const cat = it.category || form.category;
    return cat === 'egg' && (it.quantity || 0) > 0;
  }).length;

  const installmentCount = parseInt(toEn(form.installmentCount)) || 0;
  const advanceAmt = form.isPreorder && form.advanceType === 'amount'
    ? (parseFloat(toEn(form.advanceValue).replace('٫','.')) || 0)
    : 0;
  const installmentBase = Math.max(0, total - advanceAmt);
  const installmentInfo = form.paymentTerms === 'installment'
    && installmentCount > 0
    && installmentBase > 0
    ? `${toFa(installmentCount)} قسط × ~${toFa(Math.round(installmentBase / installmentCount).toLocaleString('fa-IR'))} ت`
    : null;

  const paidInfo = paid > 0 ? toFa(paid.toLocaleString('fa-IR')) + ' ت' : null;

  const expiringCount = form.items.filter(it => {
    if (!it.expiryDate) return false;
    const days = daysToExpiry(it.expiryDate);
    return days !== null && days >= 0 && days <= EXPIRY_THRESHOLD_DAYS;
  }).length;

  // ─── اگر هیچ چیز معنی‌داری نیست، نمایش نده ───
  const totalOps = flockCount + warehouseCount + incubationCount;
  if (totalOps === 0 && !installmentInfo && !paidInfo && expiringCount === 0) {
    return null;
  }

  const hasWarning = expiringCount > 0;

  return (
    <div style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--card)',
      borderRadius: 'var(--r-md)',
      padding: 'var(--sp-3)',
      marginTop: 'var(--sp-3)',
      marginBottom: 'var(--sp-2)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        position: 'absolute',
        top: 0, right: 0, bottom: 0, width: 4,
        background: hasWarning ? 'var(--warn)' : 'var(--accent)',
      }} aria-hidden="true" />

      <div style={{
        fontSize: 'var(--fs-base)',
        fontWeight: 700,
        color: 'var(--text)',
        letterSpacing: '.3px',
        marginBottom: 'var(--sp-2)',
      }}>
        📊 این فاکتور چه چیزی می‌سازد؟
      </div>

      {flockCount > 0 && (
        <Row icon="🪺" text={`${toFa(flockCount)} گله جدید`} />
      )}
      {warehouseCount > 0 && (
        <Row icon="📦" text={`${toFa(warehouseCount)} حرکت انبار`} />
      )}
      {incubationCount > 0 && (
        <Row icon="🥚" text={`${toFa(incubationCount)} بچ جوجه‌کشی`} />
      )}
      {installmentInfo && (
        <Row icon="📅" text={installmentInfo} />
      )}
      {paidInfo && (
        <Row icon="💳" text={`پرداخت‌شده: ${paidInfo}`} />
      )}
      {expiringCount > 0 && (
        <Row icon="⚠️" text={`${toFa(expiringCount)} قلم نزدیک انقضا`} tone="danger" />
      )}
    </div>
  );
}

function Row({ icon, text, tone }: { icon: string; text: string; tone?: 'danger' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--sp-2)',
      padding: 'var(--sp-1) 0',
      fontSize: 'var(--fs-sm)',
      color: tone === 'danger' ? 'var(--danger)' : 'var(--text)',
    }}>
      <span style={{ fontSize: 'var(--fs-base)', flexShrink: 0 }}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
