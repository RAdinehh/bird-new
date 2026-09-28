/**
 * قواعد هوشمندسازی — محاسبات و اعتبارسنجی خودکار
 */

/** محدود کردن عدد بین min و max */
export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** فیلد درصد — ۰ تا ۱۰۰ */
export function clampPercent(v: number | null): number | null {
  if (v === null || isNaN(v)) return null;
  return clamp(v, 0, 100);
}

/** محاسبه‌ی درصد مکمل — ۱۰۰ − مقدار */
export function complement(percent: number | null): number | null {
  if (percent === null || isNaN(percent)) return null;
  return Math.max(0, 100 - percent);
}

/** نمایش کسری */
export function fractionPercent(value: number, total: number): string {
  if (!total) return '۰٪';
  return ((value / total) * 100).toFixed(1) + '٪';
}

/** بررسی اینکه sum از max تجاوز نکند */
export function sumCheck(values: number[], max: number): boolean {
  const s = values.reduce((a, b) => a + (b || 0), 0);
  return s <= max;
}
