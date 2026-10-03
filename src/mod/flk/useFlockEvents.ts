/**
 * useFlockEvents.ts — View محاسبه‌شده از رویدادهای گله
 *
 * از این ماژول‌ها داده می‌گیره:
 *   - tra  → فاکتور خرید/فروش پرنده
 *   - dlg  → تلفات
 *   - inc  → هچ (افزودن جوجه)
 *   - egg  → تولید تخم (فقط اطلاعی)
 *   - flk  → خود گله (رکورد اولیه)
 *
 * ⚠️ هیچ داده‌ای ذخیره نمیشه — همه از استورهای دیگه خونده میشه
 */
import { useMemo } from 'react';
import { useFlk, getAgeDays, type Flock } from './store';
import { useDlg } from '../dlg/store';
import { useInc } from '../inc/store';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { useCtc } from '../ctc/store';

export type FlockEventViewType = 'initial' | 'add' | 'sell' | 'death' | 'transfer' | 'egg';

export interface FlockEventView {
  id: string;
  date: string;
  type: FlockEventViewType;
  count: number;
  sex?: 'male' | 'female' | 'mixed';
  origin?: string;
  reason?: string;
  partyName?: string;
  unitPrice?: number;
  totalPrice?: number;
  notes: string;
  source: 'tra' | 'dlg' | 'inc' | 'egg' | 'flk';
  sourceId: string;
}

function partyName(partyId: string, persons: any[]): string {
  if (!partyId) return '';
  const p = persons.find((x: any) => x.id === partyId);
  return p?.name || '';
}

export function useFlockEvents(flockId: string | null): FlockEventView[] {
  const flocks = useFlk(s => s.flocks);
  const logs = useDlg(s => s.logs);
  const hatches = useInc(s => s.hatches);
  const invoices = useTra(s => s.invoices);
  const productions = useEgg(s => s.productions);
  const persons = useCtc(s => s.persons);

  return useMemo(() => {
    if (!flockId) return [];
    const flock: Flock | undefined = flocks.find(f => f.id === flockId);
    if (!flock) return [];

    const events: FlockEventView[] = [];

    // ═══ ۱. رکورد اولیه گله ═══
    const startDate = flock.hatchDate || flock.purchaseDate || flock.startDate;
    if (startDate && (flock.initialCount || 0) > 0) {
      events.push({
        id: 'initial-' + flock.id,
        date: startDate,
        type: 'initial',
        count: flock.initialCount || 0,
        sex: 'mixed',
        origin: flock.source || 'initial',
        notes: 'ثبت اولیه گله',
        source: 'flk',
        sourceId: flock.id,
      });
    }

    // ═══ ۲. فاکتورهای tra ═══
    for (const inv of (invoices || [])) {
      if (inv.relatedFlockId !== flockId) continue;
      const isAdd = inv.type === 'purchase';
      const isSell = inv.type === 'sale' || inv.type === 'sell';
      if (!isAdd && !isSell) continue;

      // جمع تعداد از items
      const itemCount = (inv.items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      if (itemCount <= 0) continue;

      events.push({
        id: 'inv-' + inv.id,
        date: inv.date,
        type: isAdd ? 'add' : 'sell',
        count: itemCount,
        sex: 'mixed',
        origin: isAdd ? 'purchase' : undefined,
        partyName: partyName(inv.partyId, persons || []),
        totalPrice: inv.total,
        notes: inv.number ? 'فاکتور ' + inv.number : '',
        source: 'tra',
        sourceId: inv.id,
      });
    }

    // ═══ ۳. تلفات از dlg ═══
    for (const log of (logs || [])) {
      if (log.flockId !== flockId) continue;
      if (!log.deaths || log.deaths.length === 0) continue;
      for (const d of log.deaths) {
        if (!d.count || d.count <= 0) continue;
        events.push({
          id: 'death-' + log.id + '-' + d.id,
          date: log.date,
          type: 'death',
          count: d.count,
          sex: 'mixed',
          reason: d.cause || 'نامشخص',
          notes: d.notes || '',
          source: 'dlg',
          sourceId: log.id,
        });
      }
    }

    // ═══ ۴. هچ‌های زاییده (افزودن) ═══
    for (const h of (hatches || [])) {
      if (h.generatedFlockId !== flockId) continue;
      const cnt = (h.hatched || 0);
      if (cnt <= 0) continue;
      events.push({
        id: 'hatch-' + h.id,
        date: h.date,
        type: 'add',
        count: cnt,
        sex: h.maleCount && h.femaleCount
          ? (h.maleCount > 0 && h.femaleCount > 0 ? 'mixed' : (h.maleCount > 0 ? 'male' : 'female'))
          : 'mixed',
        origin: 'hatch',
        notes: 'هچ خودم' + (h.gradeA ? ' · درجه A: ' + h.gradeA : ''),
        source: 'inc',
        sourceId: h.id,
      });
    }

    // ═══ ۵. تولید تخم (فقط اطلاعی) ═══
    for (const p of (productions || [])) {
      if (p.flockId !== flockId) continue;
      if (!p.totalCount || p.totalCount <= 0) continue;
      events.push({
        id: 'egg-' + p.id,
        date: p.date,
        type: 'egg',
        count: p.totalCount,
        notes: 'تولید تخم',
        source: 'egg',
        sourceId: p.id,
      });
    }

    // ═══ مرتب‌سازی بر اساس تاریخ (قدیمی → جدید) ═══
    return events.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [flockId, flocks, logs, hatches, invoices, productions, persons]);
}
