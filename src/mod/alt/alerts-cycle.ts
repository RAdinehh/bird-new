/**
 * alerts-cycle.ts — هشدارهای چرخه تخم‌گذاری (SAP standard)
 * - ⏹ تخم‌گذاری متوقف (age > end)
 * - 🔚 پایان چرخه نزدیک (age ∈ [end-30, end])
 * - ⏰ شروع تخم‌گذاری نزدیک (age ∈ [start-14, start))
 */
import { useFlk, getAgeDays, type Flock } from '../flk/store';
import { today, type RuleAlert } from './alerts-helpers';
import { toFa } from '../../shr/utils/fa';

const START_WINDOW_DAYS = 14;
const END_WINDOW_DAYS = 30;
const FALLBACK_END_DAYS = 550;

export function detectCycleAlerts(alerts: RuleAlert[]): void {
  const flocks = useFlk.getState().flocks as Flock[];

  for (const f of flocks) {
    if (f.type !== 'layer' && f.type !== 'breeder') continue;
    if (f.status !== 'active') continue;

    const age = getAgeDays(f);
    const start = f.layingStartDay || 140;
    const end = f.endOfCycleDay || FALLBACK_END_DAYS;

    if (age > end) {
      alerts.push({
        level: 'critical',
        category: 'reproduction',
        title: `⏹ تخم‌گذاری متوقف: ${f.name}`,
        message: `${toFa(age - end)} روز از پایان چرخه گذشته. گله را آرشیو یا تمدید کنید.`,
        source: 'flk',
        sourceId: f.id + ':cycle-stopped',
        date: today(),
        notes: '',
      });
    } else if (age >= end - END_WINDOW_DAYS) {
      alerts.push({
        level: 'important',
        category: 'reproduction',
        title: `🔚 پایان چرخه نزدیک: ${f.name}`,
        message: `${toFa(end - age)} روز تا پایان چرخه باقی مانده (در سن ${toFa(end)} روز)`,
        source: 'flk',
        sourceId: f.id + ':cycle-ending',
        date: today(),
        notes: '',
      });
    } else if (age >= start - START_WINDOW_DAYS && age < start) {
      alerts.push({
        level: 'info',
        category: 'reproduction',
        title: `⏰ شروع تخم‌گذاری نزدیک: ${f.name}`,
        message: `${toFa(start - age)} روز تا شروع تخم‌گذاری (در سن ${toFa(start)} روز)`,
        source: 'flk',
        sourceId: f.id + ':cycle-starting',
        date: today(),
        notes: '',
      });
    }
  }
}
