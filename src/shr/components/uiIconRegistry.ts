import type { AppIconKey } from '../icons/AppIcons';

/** کلیدهای خام مرجع — هرگونه تغییر نام کلید در آینده فقط اینجا اصلاح می‌شود */
export const UI_ICON_MAP = {
  compare: 'compare_scale' as AppIconKey,
  profitTrend: 'profit_trend' as AppIconKey,
  period30d: 'cal_30' as AppIconKey,
  period3m: 'cal_3m' as AppIconKey,
  period6m: 'cal_6m' as AppIconKey,
  exportReport: 'export_report' as AppIconKey,
  exportExcel: 'excel_export' as AppIconKey,
  stats: 'stats' as AppIconKey,
  target: 'target' as AppIconKey,
  trophy: 'trophy' as AppIconKey,
  cash: 'cash' as AppIconKey,
  invoice: 'invoice' as AppIconKey,
  egg: 'egg' as AppIconKey,
  fertileEgg: 'fertile_egg' as AppIconKey,
  hatch: 'hatch' as AppIconKey,
  chicken: 'chicken' as AppIconKey,
  feed: 'feed' as AppIconKey,
  meds: 'meds' as AppIconKey,
  herbal: 'herbal' as AppIconKey,
  equipment: 'equipment' as AppIconKey,
  flock: 'flock' as AppIconKey,
  mortality: 'mortality' as AppIconKey,
  vaccine: 'vaccine' as AppIconKey,
  inventory: 'inventory' as AppIconKey,
  hall: 'hall' as AppIconKey,
  handTools: 'hand_tools' as AppIconKey,
  note: 'invoice' as AppIconKey,
} as const;

export type UiIconCategory =
  | 'compare'
  | 'profit'
  | 'period'
  | 'export'
  | 'invoice'
  | 'event'
  | 'inventory'
  | 'analytics'
  | 'finance'
  | 'production'
  | 'contact';

/** آیکون پیش‌فرض هر دسته برای حالتی که زیردسته وجود ندارد یا مشخص نشده است */
const CATEGORY_DEFAULT_ICON: Record<UiIconCategory, AppIconKey> = {
  compare: UI_ICON_MAP.compare,
  profit: UI_ICON_MAP.profitTrend,
  period: UI_ICON_MAP.period6m,
  export: UI_ICON_MAP.exportReport,
  invoice: UI_ICON_MAP.cash,
  event: UI_ICON_MAP.stats,
  inventory: UI_ICON_MAP.inventory,
  analytics: UI_ICON_MAP.stats,
  finance: UI_ICON_MAP.cash,
  production: UI_ICON_MAP.egg,
  contact: UI_ICON_MAP.flock,
};

/** نگاشت زیردسته‌ها به کلیدهای آیکون در هر دسته */
const SUBTYPE_ICON_MAP: Record<UiIconCategory, Record<string, AppIconKey>> = {
  compare: {
    guide: UI_ICON_MAP.compare,
    flocks: UI_ICON_MAP.compare,
    groups: UI_ICON_MAP.compare,
    egg_feed: UI_ICON_MAP.compare,
    egg_rate: UI_ICON_MAP.compare,
    mortality: UI_ICON_MAP.mortality,
    hen_day: UI_ICON_MAP.compare,
    fcr: UI_ICON_MAP.compare,
  },
  profit: {
    trend: UI_ICON_MAP.profitTrend,
    timeline: UI_ICON_MAP.profitTrend,
  },
  period: {
    '30d': UI_ICON_MAP.period30d,
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
  invoice: {
    egg: UI_ICON_MAP.egg,
    fertile_egg: UI_ICON_MAP.fertileEgg,
    chick: UI_ICON_MAP.hatch,
    adult: UI_ICON_MAP.chicken,
    feed: UI_ICON_MAP.feed,
    medicine: UI_ICON_MAP.meds,
    herbal: UI_ICON_MAP.herbal,
    equipment: UI_ICON_MAP.equipment,
  },
  event: {
    vaccine: UI_ICON_MAP.vaccine,
    herbal: UI_ICON_MAP.herbal,
    hatch: UI_ICON_MAP.hatch,
    payment: UI_ICON_MAP.cash,
  },
  inventory: {
    default: UI_ICON_MAP.inventory,
  },
  analytics: {
    pareto: UI_ICON_MAP.stats,
    share: UI_ICON_MAP.target,
    egg_feed: UI_ICON_MAP.stats,
    hen_day: UI_ICON_MAP.stats,
    best_month: UI_ICON_MAP.trophy,
  },
  finance: {
    receivable: UI_ICON_MAP.cash,
    payable: UI_ICON_MAP.invoice,
    cashflow: UI_ICON_MAP.cash,
    sales_vs_purchase: UI_ICON_MAP.cash,
    sales: UI_ICON_MAP.cash,
    purchases: UI_ICON_MAP.invoice,
  },
  production: {
    egg: UI_ICON_MAP.egg,
    mortality: UI_ICON_MAP.mortality,
    flock: UI_ICON_MAP.flock,
  },
  contact: {
    info: UI_ICON_MAP.flock,
    address: UI_ICON_MAP.hall,
    customer: UI_ICON_MAP.cash,
    vendor: UI_ICON_MAP.inventory,
    worker: UI_ICON_MAP.handTools,
    note: UI_ICON_MAP.note,
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
