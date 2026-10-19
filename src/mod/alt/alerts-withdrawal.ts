/**
 * alerts-withdrawal.ts — هشدار دوره پرهیز دارو
 *
 * فقط وقتی features.withdrawal روشنه، از rules.ts اجرا می‌شه.
 */
import { useFlk } from '../flk/store';
import { jalaliDate, todayJalali, type RuleAlert } from './alerts-helpers';
import { toFa } from '../../shr/utils/fa';

const DAY_MS = 24 * 60 * 60 * 1000;

export function detectWithdrawalAlerts(alerts: RuleAlert[]): void {
  const flocks = useFlk.getState().flocks;
  const todayD = new Date();
  todayD.setHours(0, 0, 0, 0);

  for (const f of flocks) {
    const aw = f.activeWithdrawal;
    if (!aw || !aw.until) continue;

    const until = jalaliDate(aw.until);
    if (!until) continue;

    const daysLeft = Math.round((until.getTime() - todayD.getTime()) / DAY_MS);
    if (daysLeft < 0) continue;

    const isCritical = daysLeft <= 3;
    const medName = aw.medicine || 'دارو';
    const message = isCritical
      ? `دوره پرهیز ${toFa(daysLeft)} روز مونده — دارو: ${medName} — تا ${toFa(aw.until)}. فروش نکن.`
      : `دوره پرهیز ${toFa(daysLeft)} روز مونده — دارو: ${medName} — تا ${toFa(aw.until)}.`;

    alerts.push({
      level: isCritical ? 'critical' : 'important',
      category: 'other',
      title: (isCritical ? '⚠️ پرهیز فوری: ' : 'دوره پرهیز: ') + f.name,
      message,
      source: 'flk',
      sourceId: f.id + ':withdrawal',
      date: aw.startedAt || todayJalali(),
      notes: '',
    });
  }
}
