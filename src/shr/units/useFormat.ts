/**
 * useFormat.ts — موتور مرکزی نمایش اعداد، واحدها، چندارزی و تقویم
 */
import Decimal from 'decimal.js';
import { useSet } from '../../mod/set/store';
import { parseJalali, formatGregorianFromDate } from '../date/jalali';
import {
  tomanToCurrency, gToWeight, mlToVolume, cmToLength, m2ToArea, sToTime, cToTemp,
} from './convert';
import { UNIT_SHORT } from './types';
import type { NumberFormat, ThousandSep, Units } from './types';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const SEP_MAP: Record<ThousandSep, string> = {
  fa: '٬',
  en: ',',
  space: ' ',
  dot: '.',
  slash: '/',
  none: '',
};

function getDecimalSep(fmt: NumberFormat, thousandSep: ThousandSep): string {
  // جلوگیری از تداخل نقطه هزارگان با نقطه اعشار
  if (thousandSep === 'dot') return fmt === 'fa' ? '٫' : ',';
  return fmt === 'fa' ? '٫' : '.';
}

export function applyDigits(s: string, fmt: NumberFormat): string {
  if (fmt === 'fa') return s.replace(/[0-9]/g, d => FA_DIGITS[+d]);
  return s.replace(/[۰-۹]/g, d => String(FA_DIGITS.indexOf(d)));
}

export function formatNumberRaw(
  n: number,
  fmt: NumberFormat,
  sep: ThousandSep,
  decimals: number,
): string {
  if (!Number.isFinite(n)) return '—';
  const dec = new Decimal(n).toDecimalPlaces(Math.max(0, decimals), Decimal.ROUND_HALF_UP);
  // نرمال‌سازی -0 به 0
  const isNeg = dec.isNegative() && !dec.isZero();
  const absFixed = dec.abs().toFixed(Math.max(0, decimals));
  const [intPart = '0', decPart] = absFixed.split('.');
  const sepChar = SEP_MAP[sep] ?? '';
  const intWithSep = sepChar ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sepChar) : intPart;
  let result = (isNeg ? '-' : '') + intWithSep;
  if (decimals > 0 && decPart) {
    result += getDecimalSep(fmt, sep) + decPart;
  }
  return applyDigits(result, fmt);
}

export function createFormatter(units: Units) {
  const sep = units.thousandSep;
  const nf = units.numberFormat;

  const num = (n: number | null | undefined, opts?: { decimals?: number }) => {
    if (n == null || isNaN(n as any)) return '—';
    const d = opts?.decimals ?? units.decimals;
    return formatNumberRaw(n as number, nf, sep, d);
  };

  // اعداد گسسته و شمارشی (تعداد مرغ، تخم، قطعه، روز) — همیشه صحیح
  const int = (n: number | null | undefined) => num(n, { decimals: 0 });
  const count = (n: number | null | undefined) => int(n);
  const day = (n: number | null | undefined) => int(n);

  // شناسه، کد، شماره فاکتور، سال — بدون جداکننده هزارگان
  const code = (v: string | number | null | undefined): string => {
    if (v == null || v === '') return '—';
    return applyDigits(String(v), nf);
  };

  // پول — تبدیل ارز + اعشار هوشمند (۲ رقم برای دلار، ۰ برای تومان/ریال)
  const money = (toman: number | null | undefined, opts?: { decimals?: number; withUnit?: boolean }): string => {
    if (toman == null || isNaN(toman as any)) return '—';
    const v = tomanToCurrency(toman as number, units.currency, units.usdRate);
    const defaultDec = units.currency === 'usd' ? 2 : 0;
    const d = opts?.decimals ?? defaultDec;
    const formatted = formatNumberRaw(v, nf, sep, d);
    if (opts?.withUnit === false) return formatted;
    const unit = UNIT_SHORT.currency[units.currency] || '';
    return `${formatted} ${unit}`;
  };

  const temp = (celsius: number | null | undefined): string => {
    if (celsius == null || isNaN(celsius as any)) return '—';
    const v = cToTemp(celsius as number, units.temperature);
    return `${formatNumberRaw(v, nf, sep, 1)}${UNIT_SHORT.temperature[units.temperature]}`;
  };

  const weight = (grams: number | null | undefined): string => {
    if (grams == null || isNaN(grams as any)) return '—';
    const v = gToWeight(grams as number, units.weight);
    return `${formatNumberRaw(v, nf, sep, units.decimals)} ${UNIT_SHORT.weight[units.weight]}`;
  };

  const volume = (ml: number | null | undefined): string => {
    if (ml == null || isNaN(ml as any)) return '—';
    const v = mlToVolume(ml as number, units.volume);
    return `${formatNumberRaw(v, nf, sep, units.decimals)} ${UNIT_SHORT.volume[units.volume]}`;
  };

  const length = (cm: number | null | undefined): string => {
    if (cm == null || isNaN(cm as any)) return '—';
    const v = cmToLength(cm as number, units.length);
    return `${formatNumberRaw(v, nf, sep, units.decimals)} ${UNIT_SHORT.length[units.length]}`;
  };

  const area = (m2: number | null | undefined): string => {
    if (m2 == null || isNaN(m2 as any)) return '—';
    const v = m2ToArea(m2 as number, units.area);
    return `${formatNumberRaw(v, nf, sep, units.decimals)} ${UNIT_SHORT.area[units.area]}`;
  };

  const time = (seconds: number | null | undefined): string => {
    if (seconds == null || isNaN(seconds as any)) return '—';
    const v = sToTime(seconds as number, units.time);
    return `${formatNumberRaw(v, nf, sep, 0)} ${UNIT_SHORT.time[units.time]}`;
  };

  // تاریخ — تبدیل خودکار شمسی/میلادی طبق تنظیمات
  const date = (jalaliStr: string | null | undefined): string => {
    if (!jalaliStr) return '—';
    if (units.dateFormat === 'gregorian') {
      const parsed = parseJalali(jalaliStr);
      if (parsed) {
        return applyDigits(formatGregorianFromDate(parsed), nf);
      }
    }
    return applyDigits(jalaliStr, nf);
  };

  return {
    num, int, count, day, code, money, temp, weight, volume, length, area, time, date,
    units,
    raw: { number: formatNumberRaw, digits: applyDigits },
  };
}

/** نسخه غیرهوکی برای استورها، چاپ و توابع کمکی */
export function getGlobalFormat() {
  return createFormatter(useSet.getState().units);
}

/** هوک مرکزی برای کامپوننت‌های React */
export function useFormat() {
  const units = useSet(s => s.units);
  return createFormatter(units);
}
