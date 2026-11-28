import type { AppIconKey } from '../icons/AppIcons';

/** کلیدهای خام مرجع — هرگونه تغییر نام کلید در آینده فقط اینجا اصلاح می‌شود */
export const UI_ICON_MAP = {
  compare: 'compare_scale' as AppIconKey,
  profitTrend: 'profit_trend' as AppIconKey,
  period3m: 'cal_3m' as AppIconKey,
  period6m: 'cal_6m' as AppIconKey,
  exportReport: 'export_report' as AppIconKey,
  exportExcel: 'excel_export' as AppIconKey,
  stats: 'stats' as AppIconKey,
  cash: 'cash' as AppIconKey,
  egg: 'egg' as AppIconKey,
  flock: 'flock' as AppIconKey,
  mortality: 'mortality' as AppIconKey,
} as const;

export type UiIconCategory = 'compare' | 'profit' | 'period' | 'export';

/** آیکون پیش‌فرض هر دسته برای حالتی که زیردسته وجود ندارد یا مشخص نشده است */
const CATEGORY_DEFAULT_ICON: Record<UiIconCategory, AppIconKey> = {
  compare: UI_ICON_MAP.compare,
  profit: UI_ICON_MAP.profitTrend,
  period: UI_ICON_MAP.period6m,
  export: UI_ICON_MAP.exportReport,
};

/** نگاشت زیردسته‌ها به کلیدهای آیکون در هر دسته */
const SUBTYPE_ICON_MAP: Record<UiIconCategory, Record<string, AppIconKey>> = {
  compare: {
    guide: UI_ICON_MAP.compare,
    flocks: UI_ICON_MAP.compare,
    groups: UI_ICON_MAP.compare,
    egg_feed: UI_ICON_MAP.compare,
    egg_rate: UI_ICON_MAP.compare,
    mortality: UI_ICON_MAP.compare,
    hen_day: UI_ICON_MAP.compare,
  },
  profit: {
    trend: UI_ICON_MAP.profitTrend,
    timeline: UI_ICON_MAP.profitTrend,
  },
  period: {
    '3m': UI_ICON_MAP.period3m,
    '6m': UI_ICON_MAP.period6m,
  },
  export: {
    excel: UI_ICON_MAP.exportExcel,
    xlsx: UI_ICON_MAP.exportExcel,
    csv: UI_ICON_MAP.exportReport,
    pdf: UI_ICON_MAP.exportReport,
    report: UI_ICON_MAP.exportReport,
  },
};

/**
 * حل کلید آیکون به صورت سلسله‌مراتبی:
 * ۱) تطبیق category + subType
 * ۲) بازگشت به پیش‌فرض category در صورت نبود یا ناشناس بودن subType
 */
export function resolveCategoryIconKey(category: UiIconCategory, subType?: string): AppIconKey {
  const defaultKey = CATEGORY_DEFAULT_ICON[category];
  if (!subType) return defaultKey;

  const categorySubtypes = SUBTYPE_ICON_MAP[category];
  return categorySubtypes[subType] ?? defaultKey;
}
