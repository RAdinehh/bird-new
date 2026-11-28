import type { AppIconKey } from '../icons/AppIcons';

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

export function resolveCategoryIconKey(category: UiIconCategory, subType?: string): AppIconKey {
  switch (category) {
    case 'compare':
      switch (subType) {
        case 'guide':
        case 'flocks':
        case 'groups':
        case 'egg_feed':
        case 'egg_rate':
        case 'mortality':
        case 'hen_day':
        default:
          return UI_ICON_MAP.compare;
      }
    case 'profit':
      switch (subType) {
        case 'timeline':
        case 'trend':
        default:
          return UI_ICON_MAP.profitTrend;
      }
    case 'period':
      if (subType === '3m') return UI_ICON_MAP.period3m;
      return UI_ICON_MAP.period6m;
    case 'export':
      if (subType === 'excel' || subType === 'xlsx') return UI_ICON_MAP.exportExcel;
      return UI_ICON_MAP.exportReport;
  }
}

