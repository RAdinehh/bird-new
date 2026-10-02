/**
 * useFormat.ts — hook مرکزی نمایش
 */
import { useSet } from '../../mod/set/store';
import {
  tomanToCurrency,
  gToWeight,
  mlToVolume,
  cmToLength,
  m2ToArea,
  sToTime,
  cToTemp,
} from './convert';
import { UNIT_SHORT } from './types';
import type {
  NumberFormat, ThousandSep,
} from './types';

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

const SEP_MAP: Record<ThousandSep, string> = {
  fa: '٬',
  en: ',',
  space: ' ',
  dot: '.',
  none: '',
};

const DECIMAL_SEP: Record<NumberFormat, string> = {
  fa: '٫',
  en: '.',
};

function applyDigits(s: string, fmt: NumberFormat): string {
  if (fmt === 'fa') return s.replace(/[0-9]/g, d => FA_DIGITS[+d]);
  return s;
}

function formatNumberRaw(
  n: number,
  fmt: NumberFormat,
  sep: ThousandSep,
  decimals: number,
): string {
  if (!isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const fixed = abs.toFixed(decimals);
  const [intPart = '0', decPart] = fixed.split('.');
  const sepChar = SEP_MAP[sep];
  const intWithSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sepChar);
  let result = sign + intWithSep;
  if (decimals > 0 && decPart) {
    result += DECIMAL_SEP[fmt] + decPart;
  }
  return applyDigits(result, fmt);
}

export function useFormat() {
  const units = useSet(s => s.units);

  // اگه numberFormat=en ولی thousandSep=fa → خودکار en کن
  const effectiveSep: ThousandSep =
    units.numberFormat === 'en' && units.thousandSep === 'fa'
      ? 'en'
      : units.numberFormat === 'fa' && units.thousandSep === 'en'
      ? 'fa'
      : units.thousandSep;

  // ───── اعداد ─────
  const num = (n: number | null | undefined, opts?: { decimals?: number }) => {
    if (n == null || isNaN(n as any)) return '—';
    const d = opts?.decimals ?? units.decimals;
    return formatNumberRaw(n as number, units.numberFormat, effectiveSep, d);
  };

  const int = (n: number | null | undefined) => num(n, { decimals: 0 });

  // ───── پول ─────
  const money = (toman: number | null | undefined): string => {
    if (toman == null || isNaN(toman as any)) return '—';
    const v = tomanToCurrency(toman as number, units.currency, units.usdRate);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, 0);
    const unit = UNIT_SHORT.currency[units.currency] || '';
    return `${formatted} ${unit}`;
  };

  // ───── دما ─────
  const temp = (celsius: number | null | undefined): string => {
    if (celsius == null || isNaN(celsius as any)) return '—';
    const v = cToTemp(celsius as number, units.temperature);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, 1);
    return `${formatted}${UNIT_SHORT.temperature[units.temperature]}`;
  };

  // ───── وزن ─────
  // قاعده: از decimals کاربر استفاده می‌کنه (پیش‌فرض ۲)
  const weight = (grams: number | null | undefined): string => {
    if (grams == null || isNaN(grams as any)) return '—';
    const v = gToWeight(grams as number, units.weight);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, units.decimals);
    return `${formatted} ${UNIT_SHORT.weight[units.weight]}`;
  };

  // ───── حجم ─────
  const volume = (ml: number | null | undefined): string => {
    if (ml == null || isNaN(ml as any)) return '—';
    const v = mlToVolume(ml as number, units.volume);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, units.decimals);
    return `${formatted} ${UNIT_SHORT.volume[units.volume]}`;
  };

  // ───── طول ─────
  const length = (cm: number | null | undefined): string => {
    if (cm == null || isNaN(cm as any)) return '—';
    const v = cmToLength(cm as number, units.length);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, units.decimals);
    return `${formatted} ${UNIT_SHORT.length[units.length]}`;
  };

  // ───── مساحت ─────
  const area = (m2: number | null | undefined): string => {
    if (m2 == null || isNaN(m2 as any)) return '—';
    const v = m2ToArea(m2 as number, units.area);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, units.decimals);
    return `${formatted} ${UNIT_SHORT.area[units.area]}`;
  };

  // ───── زمان ─────
  const time = (seconds: number | null | undefined): string => {
    if (seconds == null || isNaN(seconds as any)) return '—';
    const v = sToTime(seconds as number, units.time);
    const formatted = formatNumberRaw(v, units.numberFormat, effectiveSep, 0);
    return `${formatted} ${UNIT_SHORT.time[units.time]}`;
  };

  return {
    num,
    int,
    money,
    temp,
    weight,
    volume,
    length,
    area,
    time,
    units,
    raw: {
      number: formatNumberRaw,
    },
  };
}
