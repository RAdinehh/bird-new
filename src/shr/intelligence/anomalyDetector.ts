/**
 * intelligence/anomalyDetector.ts — هسته‌ی تشخیص ناهنجاری
 *
 * Pure function: از external stores فقط از طریق context و options.
 * ۵ سیگنال موازی + رأی‌گیری محافظه‌کار (≥ ۲ سیگنال برای هر سطح).
 */
import type {
  FieldProfile, AnalysisContext, Warning, Signal, AlertLevel,
} from './types';
import { getProfile } from './fieldProfiles';
import { getHistory, HistoryOptions, getUserPattern } from './historyStore';

// ══════════════════════════════════════════════════════════════════
// Helper: resolve hard limit (number or template string)
// ══════════════════════════════════════════════════════════════════
function resolveLimit(limit: number | string, ctx: AnalysisContext): number | null {
  if (typeof limit === 'number') return limit;
  // string template: '${currentCount}' یا '-730d' یا '+30d'
  const trimmed = limit.trim();
  // date offsets — برای state فعلی نادیده می‌گیریم (لایه date جدا)
  if (/^[+-]\d+d$/.test(trimmed)) return null;
  // ${var}
  const m = trimmed.match(/^\$\{(\w+)\}$/);
  if (m) {
    const v = ctx[m[1]];
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
    return null;
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════
// Helper: cross-field expected
// ══════════════════════════════════════════════════════════════════
function getCrossFieldExpected(
  rule: string | undefined,
  ctx: AnalysisContext,
): number | null {
  if (!rule) return null;
  switch (rule) {
    case 'feed_vs_flock':
      // expected = flock × perBirdGramsPerDay / 1000 (kg)
      if (ctx.flockSize && typeof ctx.perBirdGramsPerDay === 'number') {
        return (ctx.flockSize * ctx.perBirdGramsPerDay) / 1000;
      }
      return null;
    case 'water_vs_flock':
      // expected = flock × 0.5 L
      if (ctx.flockSize) return ctx.flockSize * 0.5;
      return null;
    case 'remaining_vs_feed':
      if (typeof ctx.feedAmount === 'number') return ctx.feedAmount * 0.5;
      return null;
    case 'lte_female':
      return ctx.femaleCount ?? ctx.flockSize ?? null;
    case 'lte_current':
      return ctx.currentCount ?? null;
    case 'lte_initial':
      return ctx.initialCount as number ?? null;
    case 'lte_egg_count':
      return (ctx.eggCount as number) ?? null;
    case 'lte_hall':
      return (ctx.hallCapacity as number) ?? null;
    case 'lte_initial_sum':
      return (ctx.initialCount as number) ?? null;
    case 'dose_vs_flock':
      if (ctx.flockSize && typeof ctx.dose === 'number') {
        return ctx.flockSize * ctx.dose;
      }
      return null;
    default:
      return null;
  }
}

// ══════════════════════════════════════════════════════════════════
// رأی‌گیری
// ══════════════════════════════════════════════════════════════════
function decideLevel(signals: Signal[]): AlertLevel | null {
  if (signals.length === 0) return null;
  // تک سیگنال: بر اساس وزن تصمیم بگیر
  if (signals.length === 1) {
    const w = signals[0].weight;
    if (w >= 5) return 'red';   // cross-field سخت (مثلاً تلفات > موجودی)
    if (w >= 3) return 'yellow'; // ratio قوی (مثلاً 10x)
    return null;
  }
  if (signals.length < 2) return null;  // ≥ ۲ سیگنال لازم برای بقیه
  const total = signals.reduce((s, x) => s + x.weight, 0);
  if (total >= 5) return 'red';
  if (total >= 3) return 'orange';
  if (total >= 2) return 'yellow';
  return null;
}

// ══════════════════════════════════════════════════════════════════
// API اصلی
// ══════════════════════════════════════════════════════════════════
export interface AnalyzeOptions extends HistoryOptions {
  /** آستانه تأیید/رد — بعد از ۵ رد، آستانه بازتر می‌شود */
  dismissalCount?: number;
}

export function analyzeAnomaly(
  fieldPath: string,
  value: number,
  context: AnalysisContext = {},
  opts: AnalyzeOptions = {},
): Warning | null {
  const profile: FieldProfile | null = getProfile(fieldPath);
  if (!profile) return null;  // فیلد بدون profile → بدون هشدار

  // ═══ ۱. Hard limits (همیشه) ═══
  const hMin = resolveLimit(profile.hardMin, context);
  const hMax = resolveLimit(profile.hardMax, context);
  if (hMin !== null && value < hMin) {
    return {
      level: 'red', field: fieldPath, value,
      reason: `کمتر از حداقل مجاز (${hMin})`,
      signals: [{ type: 'hard_min', weight: 10, detail: `value<${hMin}` }],
    };
  }
  if (hMax !== null && value > hMax) {
    return {
      level: 'red', field: fieldPath, value,
      reason: `بیشتر از حداکثر مجاز (${hMax})`,
      signals: [{ type: 'hard_max', weight: 10, detail: `value>${hMax}` }],
    };
  }

  // ═══ ۲. اگر hard_only → بدون هشدار نرم ═══
  if (profile.expectedFrom === 'hard_only') return null;

  // ═══ ۳. جمع‌آوری سیگنال‌ها ═══
  const signals: Signal[] = [];

  // ─── سیگنال ۱: نسبت به expected ───
  let expected: number | null = null;

  if (typeof context.expected === 'number' && Number.isFinite(context.expected)) {
    expected = context.expected;
  }
  // Cascade fallback: اگر استراتژی اول null داد، سراغ بعدی برو
  if (expected === null && profile.expectedFrom === 'cross_field' && profile.crossFieldRule) {
    expected = getCrossFieldExpected(profile.crossFieldRule, context);
  }
  if (expected === null && profile.expectedFrom === 'user_pattern') {
    const pattern = getUserPattern(fieldPath, opts);
    if (pattern) expected = pattern.mean;
  }
  if (expected === null) {
    const histFb = getHistory(fieldPath, opts);
    if (histFb?.stats) {
      expected = histFb.stats.structuralBreak && histFb.stats.recentMean
        ? histFb.stats.recentMean
        : histFb.stats.mean;
    }
  }

  // برای comparison='absolute' (cross-field سخت مثل deaths≤alive), ratio معنی ندارد
  if (profile.comparison !== 'absolute' && expected !== null && expected > 0) {
    const ratio = value / expected;
    if (ratio > 5) signals.push({ type: 'ratio', weight: 3, detail: `${ratio.toFixed(1)}x (خیلی بالا)` });
    else if (ratio > 3) signals.push({ type: 'ratio', weight: 2, detail: `${ratio.toFixed(1)}x (بالا)` });
    else if (ratio > 1.5) signals.push({ type: 'ratio', weight: 1, detail: `${ratio.toFixed(1)}x` });
    else if (ratio < 0.3) signals.push({ type: 'ratio', weight: 2, detail: `${ratio.toFixed(2)}x (پایین)` });
    else if (ratio < 0.5) signals.push({ type: 'ratio', weight: 1, detail: `${ratio.toFixed(2)}x (پایین)` });
  }

  // ─── سیگنال ۲: Z-Score ───
  const hist = getHistory(fieldPath, opts);
  if (hist?.stats && hist.stats.count >= 3) {
    const effectiveStd = Math.max(hist.stats.std, hist.stats.mean * 0.10);
    const z = Math.abs(value - hist.stats.mean) / effectiveStd;
    if (z > 4) signals.push({ type: 'zscore', weight: 3, detail: `z=${z.toFixed(1)}` });
    else if (z > 3) signals.push({ type: 'zscore', weight: 2, detail: `z=${z.toFixed(1)}` });
    else if (z > 2) signals.push({ type: 'zscore', weight: 1, detail: `z=${z.toFixed(1)}` });
  }

  // ─── سیگنال ۳: IQR ───
  if (hist?.stats && hist.stats.count >= 5) {
    const iqr = hist.stats.p75 - hist.stats.p25;
    if (iqr > 0 && (value > hist.stats.p75 + 3 * iqr || value < hist.stats.p25 - 3 * iqr)) {
      signals.push({ type: 'iqr', weight: 2, detail: 'خارج IQR' });
    }
  }

  // ─── سیگنال ۴: خارج از محدوده زیستی ───
  if (profile.biologicalRange) {
    const br = profile.biologicalRange;
    if (value < br.min || value > br.max) {
      signals.push({ type: 'biological', weight: 1, detail: `${value} خارج ${br.min}-${br.max}` });
    }
  }

  // ─── سیگنال ۵: Cross-field سخت ───
  if (profile.crossFieldRule && profile.comparison === 'absolute') {
    const max = getCrossFieldExpected(profile.crossFieldRule, context);
    if (max !== null && value > max) {
      signals.push({ type: 'cross_absolute', weight: 5, detail: `${value} > ${max}` });
    }
  }

  // ─── سیگنال ۶: کاربر pattern (برای درصد) ───
  if (profile.expectedFrom === 'user_pattern') {
    const pattern = getUserPattern(fieldPath, opts);
    if (pattern && pattern.count >= 3) {
      let warnPct: number, critPct: number;
      if (pattern.cv < 0.10) { warnPct = 0.30; critPct = 0.50; }
      else if (pattern.cv < 0.30) { warnPct = 0.50; critPct = 0.80; }
      else { warnPct = 0.80; critPct = 1.20; }
      const dev = Math.abs(value - pattern.mean) / (pattern.mean || 1);
      if (dev > critPct) signals.push({ type: 'pattern', weight: 3, detail: `${(dev * 100).toFixed(0)}% انحراف` });
      else if (dev > warnPct) signals.push({ type: 'pattern', weight: 2, detail: `${(dev * 100).toFixed(0)}% انحراف` });
    }
  }

  // ═══ ۴. اگر structural break → وزن‌ها را کاهش بده ═══
  if (profile.structuralBreakAware && hist?.stats?.structuralBreak) {
    signals.forEach(s => { s.weight *= 0.3; });
  }

  // ═══ ۵. تصمیم نهایی ═══
  const level = decideLevel(signals);
  if (!level) return null;

  return {
    level,
    field: fieldPath,
    value,
    reason: signals[0]?.detail ?? 'ناهنجاری تشخیص داده شد',
    expected: expected ?? undefined,
    signals,
  };
}

// ══════════════════════════════════════════════════════════════════
// wrapper برای ذخیره خودکار بعد از تحلیل
// ══════════════════════════════════════════════════════════════════
import { recordHistory } from './historyStore';

export function analyzeAndRecord(
  fieldPath: string,
  value: number,
  context: AnalysisContext = {},
  opts: AnalyzeOptions = {},
): Warning | null {
  const warning = analyzeAnomaly(fieldPath, value, context, opts);
  try {
    recordHistory(fieldPath, value, context, opts);
  } catch { /* silent */ }
  return warning;
}

export { getCrossFieldExpected };
