/**
 * DlgHistoryModal.tsx — تاریخچه کامل رویدادهای یک لاگ
 * استاندارد: FlockHistoryModal (گروه‌بندی تاریخ، Chip فیلتر، لغو فقط آخرین)
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow, ShowMoreButton, Sheet, Row } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { downloadCSV } from '../../../shr/utils/export';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { useDlg, type DailyLog } from '../store';
import type { DlgEvent, DlgEventType } from '../types-events';

const TYPE_META: Record<string, { label: string; tone: string }> = {
  create:     { label: 'ثبت اولیه',   tone: 'var(--accent)' },
  reading:    { label: 'اندازه‌گیری',  tone: 'var(--info)' },
  feed:       { label: 'دان',         tone: 'var(--warn)' },
  water:      { label: 'آب',          tone: 'var(--info)' },
  death:      { label: 'تلفات',       tone: 'var(--danger)' },
  egg:        { label: 'تخم',         tone: 'var(--purple)' },
  vaccine:    { label: 'واکسن',       tone: 'var(--accent)' },
  medication: { label: 'دارو',        tone: 'var(--warn)' },
  weight:     { label: 'وزن',         tone: 'var(--info)' },
  correction: { label: 'اصلاح',       tone: 'var(--warn)' },
  health:     { label: 'سلامت',       tone: 'var(--accent)' },
};

const FIELD_LABEL: Record<string, string> = {
  temperature: 'دما (°C)', temperatureMin: 'حداقل دما (°C)', temperatureMax: 'حداکثر دما (°C)',
  humidity: 'رطوبت (٪)', humidityMin: 'حداقل رطوبت (٪)', humidityMax: 'حداکثر رطوبت (٪)',
  feedDelivered: 'دان توزیع‌شده (kg)', feedRemaining: 'دان باقی‌مانده (kg)',
  waterAmount: 'آب مصرفی (L)',
  deathsCount: 'تلفات (عدد)',
  eatingEggs: 'تخم خوراکی (عدد)', fertileEggs: 'تخم نطفه‌دار (عدد)',
  brokenEggs: 'تخم شکسته (عدد)', otherEggs: 'تخم سایر (عدد)',
  weight: 'وزن (kg)',
};

const VISIBLE_LIMIT = 10;

interface Props { open: boolean; onClose: () => void; log: DailyLog | null; }

type TimelineItem =
  | { kind: 'event'; time: string; event: DlgEvent }
  | { kind: 'merged-reading'; time: string; events: DlgEvent[] }
  | { kind: 'merged-health'; time: string; events: DlgEvent[] }
  | { kind: 'merged-nutrition'; time: string; events: DlgEvent[] }
  | { kind: 'correction'; time: string; correction: NonNullable<DailyLog['corrections']>[number] };

export default function DlgHistoryModal({ open, onClose, log }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const { revokeEvent, revokeCorrection } = useDlg();

  const items: TimelineItem[] = useMemo(() => {
    if (!log) return [];
    const list: TimelineItem[] = [];
    const readingByTime = new Map<string, DlgEvent[]>();
    const healthByTime = new Map<string, DlgEvent[]>();
    const nutritionByTime = new Map<string, DlgEvent[]>();
    for (const ev of log.events || []) {
      if (ev.type === 'reading') {
        const k = ev.entryTime || ev.createdAt || '';
        if (!readingByTime.has(k)) readingByTime.set(k, []);
        readingByTime.get(k)!.push(ev);
      } else if (['vaccine', 'medication', 'death', 'activity'].includes(ev.type)) {
        const k = ev.entryTime || ev.createdAt || '';
        if (!healthByTime.has(k)) healthByTime.set(k, []);
        healthByTime.get(k)!.push(ev);
      } else if (['feed', 'water'].includes(ev.type)) {
        const k = ev.entryTime || ev.createdAt || '';
        if (!nutritionByTime.has(k)) nutritionByTime.set(k, []);
        nutritionByTime.get(k)!.push(ev);
      } else {
        list.push({ kind: 'event', time: ev.createdAt || '', event: ev });
      }
    }
    for (const [time, evs] of readingByTime.entries()) {
      if (evs.length > 1) list.push({ kind: 'merged-reading', time, events: evs });
      else list.push({ kind: 'event', time, event: evs[0] });
    }
    for (const [time, evs] of healthByTime.entries()) {
      if (evs.length > 1) list.push({ kind: 'merged-health', time, events: evs });
      else list.push({ kind: 'event', time, event: evs[0] });
    }
    for (const [time, evs] of nutritionByTime.entries()) {
      if (evs.length > 1) list.push({ kind: 'merged-nutrition', time, events: evs });
      else list.push({ kind: 'event', time, event: evs[0] });
    }
    for (const corr of log.corrections || []) list.push({ kind: 'correction', time: corr.timestamp || '', correction: corr });
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [log]);

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const k = it.kind === 'event' ? it.event.type
              : it.kind === 'merged-reading' ? 'reading'
              : it.kind === 'merged-health' ? 'health'
              : it.kind === 'merged-nutrition' ? 'nutrition'
              : 'correction';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(it => {
      const k = it.kind === 'event' ? it.event.type
              : it.kind === 'merged-reading' ? 'reading'
              : it.kind === 'merged-health' ? 'health'
              : it.kind === 'merged-nutrition' ? 'nutrition'
              : 'correction';
      return k === filter;
    });
  }, [items, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const it of filtered) {
      const d = it.kind === 'event' ? it.event.date : (it.kind === 'correction' ? (log?.date || '') : it.events[0].date);
      const t = it.kind === 'event' ? it.event.entryTime : (it.kind === 'correction' ? (log?.entryTime || '') : it.events[0].entryTime);
      const key = `${d}|${t || ''}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(k => {
      const [date, time] = k.split('|');
      return { label: date, time, items: map.get(k)! };
    });
  }, [filtered, log]);

  const visibleData = useMemo(() => {
    if (showAll) return { items: groups, hidden: 0 };
    let total = 0;
    const out: typeof groups = [];
    for (const g of groups) {
      if (total >= VISIBLE_LIMIT) break;
      out.push(g);
      total += g.items.length;
    }
    const allTotal = groups.reduce((s, g) => s + g.items.length, 0);
    return { items: out, hidden: allTotal - total };
  }, [groups, showAll]);

  // شناسه آخرین رویداد — فقط این قابل لغو است
  const latestItemId = (() => {
    let latest: { time: string; id: string } | null = null;
    for (const ev of log?.events || []) {
      const t = ev.createdAt || '';
      if (!latest || t > latest.time) latest = { time: t, id: ev.id };
    }
    for (const corr of log?.corrections || []) {
      const t = corr.timestamp || '';
      if (!latest || t > latest.time) latest = { time: t, id: corr.id };
    }
    return latest?.id || null;
  })();

  const handleExport = () => {
    if (!log) return;
    try {
      const headers = ['زمان', 'نوع', 'فیلد', 'قبل', 'بعد', 'دلیل', 'لغو شده'];
      const rows = items.flatMap(it => {
        if (it.kind === 'merged-reading') {
          return it.events.map(ev => {
            const m = TYPE_META[ev.type];
            return [ev.entryTime || ev.createdAt, m.label, ev.field || '', ev.value ?? '', '', ev.reason || ev.notes || '', ev.revoked ? 'بله' : 'خیر'];
          });
        }
        if (it.kind === 'merged-nutrition') {
          return it.events.map(ev => {
            const m = TYPE_META[ev.type];
            return [ev.entryTime || ev.createdAt, m.label, '', ev.amount ?? '', '', '', ev.revoked ? 'بله' : 'خیر'];
          });
        }
        if (it.kind === 'merged-health') {
          return it.events.map(ev => {
            const m = TYPE_META[ev.type];
            return [ev.entryTime || ev.createdAt, m.label, ev.notes || '', '', '', ev.reason || '', ev.revoked ? 'بله' : 'خیر'];
          });
        }
        if (it.kind === 'event') {
          const m = TYPE_META[it.event.type];
          return [[it.event.entryTime || it.event.createdAt, m.label, it.event.field || '', it.event.before ?? '', it.event.after ?? it.event.value ?? it.event.amount ?? it.event.count ?? '', it.event.reason || it.event.notes || '', it.event.revoked ? 'بله' : 'خیر']];
        }
        const c = it.correction;
        const fields = Object.keys(c.changes).map(k => `${FIELD_LABEL[k] || k}: ${(log as any)[k] ?? '—'}→${(c.changes as any)[k] ?? '—'}`).join(' • ');
        return [[c.timestamp, 'اصلاح', fields, '', '', c.reason, c.revoked ? 'بله' : 'خیر']];
      });
      const csv = [headers.join(','), ...rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n');
      downloadCSV(`dlg-${log.id}.csv`, '\uFEFF' + csv);
      toastMsg.success('CSV دانلود شد');
    } catch { toastMsg.error('دانلود ناموفق'); }
  };

  const handleRevokeEvent = async (ev: DlgEvent) => {
    const ok = await showConfirmAsync('لغو رویداد', 'این رویداد لغو شود؟');
    if (!ok) return;
    revokeEvent(log!.id, ev.id);
  };

  const handleRevokeCorrection = async (corrId: string) => {
    const ok = await showConfirmAsync('لغو اصلاح', 'این اصلاح لغو شود؟');
    if (!ok) return;
    revokeCorrection(log!.id, corrId);
  };

  if (!log) return null;

  return (
    <Modal open={open} onClose={onClose} title={`📜 تاریخچه — ${log.entryTime ? toFa(log.entryTime) + ' • ' : ''}${toFa(log.date)}`}
      footer={<BtnRow><Btn onClick={handleExport}>📥 CSV</Btn><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      {/* ═══ هدر خلاصه سبز ═══ */}
      <div style={{
        padding: '4px 4px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 0,
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <b style={{ color: 'var(--accent)', fontSize: 'var(--fs-sm)' }}>خلاصه ثبت روزانه</b>
          <span style={{ color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
            {toFa(items.length)} رویداد
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>
          <span>تاریخ: <b>{toFa(log.date)}</b></span>
          <span>ساعت: <b>{toFa(log.entryTime || '—')}</b></span>
        </div>
      </div>

      {/* ═══ دکمه فیلتر فشرده ═══ */}
      {items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
          <button 
            type="button"
            onClick={() => setFilterSheetOpen(true)}
            style={{
              padding: '6px 12px',
              background: filter === 'all' ? 'var(--input-bg)' : 'var(--accent-soft)',
              border: `1px solid ${filter === 'all' ? 'var(--border)' : 'var(--accent)'}`,
              borderRadius: 'var(--r-sm)',
              color: filter === 'all' ? 'var(--muted)' : 'var(--accent)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>فیلتر:</span>
            <b>{filter === 'all' ? 'همه' : (TYPE_META[filter as DlgEventType]?.label || 'اصلاح')}</b>
            <span style={{ opacity: 0.6 }}>▾</span>
          </button>
        </div>
      )}

      {/* ═══ Sheet فیلتر ═══ */}
      <Sheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} title="فیلتر رویدادها">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={() => { setFilter('all'); setFilterSheetOpen(false); }}
            style={{
              padding: '4px 4px', background: filter === 'all' ? 'var(--accent-soft)' : 'var(--card)',
              border: `1px solid ${filter === 'all' ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 'var(--r-sm)', color: filter === 'all' ? 'var(--accent)' : 'var(--text)',
              textAlign: 'right', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
              cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
            }}
          >
            <span>همه</span>
            <span>({toFa(items.length)})</span>
          </button>
          {Array.from(typeCounts.entries()).map(([type, count]) => {
            const meta = TYPE_META[type as DlgEventType] || { label: 'اصلاح', tone: 'var(--warn)' };
            const isActive = filter === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => { setFilter(type); setFilterSheetOpen(false); }}
                style={{
                  padding: '4px 4px', background: isActive ? 'var(--accent-soft)' : 'var(--card)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', color: isActive ? 'var(--accent)' : 'var(--text)',
                  textAlign: 'right', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
                }}
              >
                <span>{meta.label}</span>
                <span>({toFa(count)})</span>
              </button>
            );
          })}
        </div>
      </Sheet>

      {/* ═══ محتوا ═══ */}
      {items.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}><div style={{ fontSize: 40, marginBottom: 8 }}>📜</div><div>هنوز رویدادی ثبت نشده</div></div>
      ) : (
        <>
          {visibleData.items.map(group => (
            <div key={group.label + group.time} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>
                <span>📅 {toFa(group.label)}</span>
                {group.time && <span style={{ fontFamily: 'monospace' }}>{toFa(group.time)}</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.items.map((it) => {
                  if (it.kind === 'merged-reading') {
                    return <MergedReadingRow key={it.events[0].id} events={it.events} />;
                  }
                  if (it.kind === 'merged-health') {
                    return <MergedHealthRow key={it.events[0].id} events={it.events} />;
                  }
                  if (it.kind === 'merged-nutrition') {
                    return <MergedNutritionRow key={it.events[0].id} events={it.events} />;
                  }
                  if (it.kind === 'event') {
                    const isTrulyLatest = it.event.id === latestItemId;
                    return <EventRow key={it.event.id} ev={it.event} isLatest={isTrulyLatest} onRevoke={() => handleRevokeEvent(it.event)} />;
                  }
                  const isTrulyLatest = it.correction.id === latestItemId;
                  return <CorrectionRow key={it.correction.id} corr={it.correction} log={log} isLatest={isTrulyLatest} onRevoke={() => handleRevokeCorrection(it.correction.id)} />;
                })}
              </div>
            </div>
          ))}
          {visibleData.hidden > 0 && <div style={{ marginTop: 10 }}><ShowMoreButton count={visibleData.hidden} onClick={() => setShowAll(true)} /></div>}
        </>
      )}
    </Modal>
  );
}

function EventRow({ ev, isLatest, onRevoke }: { ev: DlgEvent; isLatest: boolean; onRevoke: () => void }) {
  if (ev.type === 'death' && (!ev.count || ev.count === 0)) return null;
  if (ev.type === 'create') return null;

  const meta = TYPE_META[ev.type];
  const isRevoked = ev.revoked === true;
  
  // استخراج مقدار برای نمایش در یک خط
  let valueStr: string | React.ReactNode = '';
  if (ev.before !== undefined && ev.after !== undefined) {
    valueStr = (
      <span style={{ fontFamily: 'monospace' }}>
        <span style={{ color: 'var(--danger)' }}>{toFa(String(ev.before ?? '—'))}</span>
        <span style={{ color: 'var(--muted)', margin: '0 4px' }}>←</span>
        <span style={{ color: 'var(--accent)' }}>{toFa(String(ev.after ?? '—'))}</span>
      </span>
    );
  } else if (ev.type === 'water' && ev.amount !== undefined) {
    valueStr = `${toFa(ev.amount)} لیتر`;
  } else if (ev.type === 'feed' && ev.amount !== undefined) {
    valueStr = `${toFa(ev.amount)} کیلوگرم`;
  } else if (ev.type === 'death' && ev.count !== undefined) {
    valueStr = `${toFa(ev.count)} عدد`;
  } else if (ev.type === 'vaccine' || ev.type === 'medication') {
    valueStr = ev.notes || ev.reason || 'ثبت شده';
  } else if (ev.field) {
    valueStr = toFa(ev.value ?? 0);
  } else if (ev.value !== undefined && ev.value !== null) {
    valueStr = toFa(ev.value);
  }

  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)',
      opacity: isRevoked ? 0.7 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      {/* Header: نوع + زمان */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b style={{ color: meta.tone, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{meta.label}</b>
          {ev.field && ev.type !== 'water' && ev.type !== 'feed' && ev.type !== 'death' && ev.type !== 'vaccine' && ev.type !== 'medication' && (
            <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>({FIELD_LABEL[ev.field] || ev.field})</span>
          )}
        </div>
      </div>

      {/* Body: مقدار + دلیل + دکمه لغو */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-sm)', fontWeight: 700, color: meta.tone }}>
            {valueStr}
          </span>
          {ev.reason && (
            <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)' }}>({ev.reason})</span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isRevoked && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--danger)' }}>لغو شده</span>}
          {isLatest && !isRevoked && (
            <button
              type="button"
              onClick={onRevoke}
              style={{
                padding: '2px 8px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-2xs)', color: 'var(--danger)', cursor: 'pointer'
              }}
            >لغو</button>
          )}
        </div>
      </div>
    </div>
  );
}

function CorrectionRow({ corr, log, isLatest, onRevoke }: { corr: NonNullable<DailyLog['corrections']>[number]; log: DailyLog; isLatest: boolean; onRevoke: () => void }) {
  const isRevoked = corr.revoked === true;
  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)',
      opacity: isRevoked ? 0.7 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>اصلاح دستی</b>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
        {Object.keys(corr.changes).map(k => {
          const before = (log as any)[k];
          const after = (corr.changes as any)[k];
          return (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>{FIELD_LABEL[k] || k}:</span>
              <span style={{ fontFamily: 'monospace' }}>
                <span style={{ color: 'var(--danger)' }}>{toFa(String(before ?? '—'))}</span>
                <span style={{ color: 'var(--muted)', margin: '0 4px' }}>←</span>
                <span style={{ color: 'var(--accent)' }}>{toFa(String(after ?? '—'))}</span>
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)' }}>
          {corr.reason ? `دلیل: ${corr.reason}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {isRevoked && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--danger)' }}>لغو شده</span>}
          {isLatest && !isRevoked && (
            <button
              type="button"
              onClick={onRevoke}
              style={{
                padding: '2px 8px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-2xs)', color: 'var(--danger)', cursor: 'pointer'
              }}
            >لغو</button>
          )}
        </div>
      </div>
    </div>
  );
}


function MergedReadingRow({ events }: { events: DlgEvent[] }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ color: 'var(--info)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>اندازه‌گیری محیط</b>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.map(ev => (
          <Row
            key={ev.id}
            l={FIELD_LABEL[ev.field || ''] || ev.field || 'مقدار'}
            v={<span style={{ fontFamily: 'monospace', color: 'var(--info)' }}>{toFa(ev.value ?? 0)}</span>}
          />
        ))}
      </div>
    </div>
  );
}

function MergedHealthRow({ events }: { events: DlgEvent[] }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ color: 'var(--accent)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>سلامت (واکسن / دارو / تلفات / فعالیت)</b>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.map(ev => {
          let l = '', v = '';
          if (ev.type === 'vaccine') { l = 'واکسن'; v = ev.notes || 'ثبت شده'; }
          else if (ev.type === 'medication') { l = 'دارو'; v = ev.notes || 'ثبت شده'; }
          else if (ev.type === 'death') { l = 'تلفات'; v = `${toFa(ev.count || 0)} عدد`; }
          else if (ev.type === 'activity') { l = 'فعالیت'; v = ev.notes || 'ثبت شده'; }
          return <Row key={ev.id} l={l} v={<span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{v}</span>} />;
        })}
      </div>
    </div>
  );
}

function MergedNutritionRow({ events }: { events: DlgEvent[] }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>تغذیه و آب</b>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.map(ev => {
          let l = '', v = '';
          if (ev.type === 'feed') { l = 'مصرف دان'; v = `${toFa(ev.amount || 0)} کیلوگرم`; }
          else if (ev.type === 'water') { l = 'مصرف آب'; v = `${toFa(ev.amount || 0)} لیتر`; }
          return <Row key={ev.id} l={l} v={<span style={{ fontFamily: 'monospace', color: 'var(--warn)' }}>{v}</span>} />;
        })}
      </div>
    </div>
  );
}
