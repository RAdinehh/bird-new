/**
 * alerts-inc.ts — هشدارهای جوجه‌کشی و انکوباسیون
 * جدا شده از rules.ts
 */
import { useInc, daysToHatch, isHatchWindow } from '../inc/store';
import { useBrd } from '../brd/store';
import { useSet } from '../set/store';
import { getStandardFor } from '../set/standards/index';
import { calcWeightLossPct, isEstInRange, isCo2InRange, isO2InRange } from '../inc/api/hatchCalc';
import { toFa } from '../../shr/utils/fa';
import { startOfDay, differenceInCalendarDays as diffCalDays } from 'date-fns-jalali';
import { today, jalaliDate, todayJalali, type RuleAlert } from './alerts-helpers';

export function detectIncAlerts(alerts: RuleAlert[]): void {
  const _s = useSet.getState() as any;

  // ============ ۶. جوجه‌کشی ============
  const entries = useInc.getState().eggEntries;
  const devices = useInc.getState().devices;
  const breedsForInc = useBrd.getState().breeds;
  const customStandardsForInc = _s.customStandards || {};

  entries.forEach(entry => {
    if (entry.status === 'done' || entry.status === 'hatched') return;

    const days = daysToHatch(entry.expectedHatchDate);

    // Lock-down امروز
    const entryDate = jalaliDate(entry.entryDate);
    const age = entryDate ? diffCalDays(startOfDay(new Date()), entryDate) : 0;

    if (age === 18) {
      alerts.push({
        level: 'important',
        category: 'reproduction',
        title: '🔒 Lock-down امروز',
        message: toFa(entry.count || 0) + ' تخم — چرخش قطع، رطوبت بالا',
        source: 'inc',
        sourceId: entry.id + ':lockdown',
        date: today(), notes: ''
      });
    }

    if (isHatchWindow(entry)) {
      alerts.push({
        level: 'critical',
        category: 'reproduction',
        title: '🐣 پنجره هچ باز است',
        message: toFa(entry.count || 0) + ' تخم — ' + (days <= 0 ? 'امروز' : toFa(days) + ' روز تا هچ'),
        source: 'inc',
        sourceId: entry.id + ':hatch-window',
        date: today(), notes: ''
      });
    } else if (days > 0 && days <= 3) {
      alerts.push({
        level: 'info',
        category: 'reproduction',
        title: '📅 نزدیک هچ',
        message: toFa(days) + ' روز تا هچ ' + toFa(entry.count || 0) + ' تخم',
        source: 'inc',
        sourceId: entry.id + ':hatch-near',
        date: today(), notes: ''
      });
    }

    // 🆕 وضعیت چرخش (روز ۱۸ باید قطع شه)
    const entryDevice = devices.find(dev => dev.id === entry.deviceId);
    const turningState = entryDevice?.turningCurrent;
    if (turningState && turningState !== 'auto' && entry.breedId) {
      const tBreed = breedsForInc.find(b => b.id === entry.breedId);
      const tStdKey = (tBreed as { standardKey?: string } | undefined)?.standardKey || tBreed?.name;
      const tStd = tStdKey ? (getStandardFor(tStdKey, { customStandards: customStandardsForInc }) as any) : null;
      const lockDay = tStd?.incubation?.lockdownDay ?? 18;
      const beforeLock = age > 0 && age < lockDay;
      const inLock = age >= lockDay;
      if (beforeLock && turningState === 'off') {
        alerts.push({
          level: 'important',
          category: 'reproduction',
          title: '⏸ چرخش قطع — قبل از روز ' + toFa(lockDay),
          message: toFa(entry.count || 0) + ' تخم — روز ' + toFa(age) + '، چرخش باید روشن باشه',
          source: 'inc',
          sourceId: entry.id + ':turning-off-early',
          date: today(), notes: ''
        });
      } else if (inLock && turningState === 'on') {
        alerts.push({
          level: 'critical',
          category: 'reproduction',
          title: '🔄 چرخش روشن — باید قطع باشه',
          message: toFa(entry.count || 0) + ' تخم — روز ' + toFa(age) + ' (بعد از lock-down)، فوراً چرخش رو قطع کن',
          source: 'inc',
          sourceId: entry.id + ':turning-on-late',
          date: today(), notes: ''
        });
      }
    }

    // 🆕 کاهش وزن تخم (استاندارد Ross: ۱۱-۱۳٪ تا روز ۱۸)
    const wInit = entry.sampleWeightInitial;
    const wCur = entry.sampleWeightCurrent;
    if (wInit && wCur && age >= 7 && age <= 18) {
      const pct = calcWeightLossPct(wInit, wCur);
      if (pct !== null) {
        const breed = breedsForInc.find(b => b.id === entry.breedId);
        const stdKey = (breed as { standardKey?: string } | undefined)?.standardKey || breed?.name;
        const std = stdKey ? (getStandardFor(stdKey, { customStandards: customStandardsForInc }) as any) : null;
        const minPct = std?.incubation?.weightLossMinPct ?? 11;
        const maxPct = std?.incubation?.weightLossMaxPct ?? 13;
        if (pct < minPct || pct > maxPct) {
          const tooFast = pct > maxPct;
          const far = (pct > maxPct + 3) || (pct < minPct - 3);
          alerts.push({
            level: far ? 'critical' : 'important',
            category: 'reproduction',
            title: (tooFast ? '🔴 کاهش وزن تخم سریع' : '🟡 کاهش وزن تخم کند') + ' — ' + toFa(entry.count || 0) + ' تخم',
            message: 'کاهش وزن: ' + toFa(pct) + '٪ (هدف: ' + toFa(minPct) + '-' + toFa(maxPct) + '٪) — روز ' + toFa(age) + (tooFast ? ' رطوبت کم است' : ' رطوبت زیاد است'),
            source: 'inc',
            sourceId: entry.id + ':weight-loss',
            date: today(), notes: ''
          });
        }
      }
    }
  });

  // 🆕 ============ ۶.۵. پایش زنده دستگاه‌های انکوباسیون ============
  const breedsForDev = useBrd.getState().breeds;

  devices.forEach(device => {
    if (device.status !== 'active' && device.status !== 'idle') return;

    // پیدا کردن نژاد مرجع دستگاه (اولین capacityByBird یا default)
    const refBirdName = device.capacityByBird?.[0]?.birdName;
    const refBreed = refBirdName ? breedsForDev.find(b => b.name === refBirdName || b.standardKey === refBirdName) : null;
    const stdKey = (refBreed as { standardKey?: string } | undefined)?.standardKey || refBreed?.name;
    const std = stdKey ? (getStandardFor(stdKey, { customStandards: customStandardsForInc }) as any) : null;

    // EST — دمای پوسته تخم
    const est = (device as any).estCurrent;
    if (est != null && !isEstInRange(est, std)) {
      const range = std?.incubation?.estMinTemp && std?.incubation?.estMaxTemp
        ? `${std.incubation.estMinTemp}-${std.incubation.estMaxTemp}`
        : '37.5-38.0';
      alerts.push({
        level: 'critical',
        category: 'temp',
        title: '🌡 EST خارج بازه — ' + device.name,
        message: 'دمای پوسته تخم: ' + toFa(est) + '°C (هدف: ' + range + '°C) — تنظیم فوری دما',
        source: 'inc',
        sourceId: device.id + ':est-out',
        date: today(), notes: ''
      });
    }

    // CO₂
    const co2 = (device as any).co2Current;
    if (co2 != null && !isCo2InRange(co2, std)) {
      alerts.push({
        level: 'critical',
        category: 'temp',
        title: '💨 CO₂ بالا — ' + device.name,
        message: 'CO₂: ' + toFa(co2) + '٪ (حد مجاز: ' + toFa(std?.incubation?.co2MaxPct ?? 0.5) + '٪) — افزایش تهویه',
        source: 'inc',
        sourceId: device.id + ':co2-high',
        date: today(), notes: ''
      });
    }

    // O₂
    const o2 = (device as any).o2Current;
    if (o2 != null && !isO2InRange(o2, std)) {
      alerts.push({
        level: 'critical',
        category: 'temp',
        title: '💨 O₂ پایین — ' + device.name,
        message: 'O₂: ' + toFa(o2) + '٪ (حد مجاز: ' + toFa(std?.incubation?.o2MinPct ?? 20) + '٪) — افزایش تهویه',
        source: 'inc',
        sourceId: device.id + ':o2-low',
        date: today(), notes: ''
      });
    }
  });
}
