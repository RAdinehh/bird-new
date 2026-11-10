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

const TYPE_META: Record<DlgEventType, { label: string; tone: string }> = {
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
    for (const ev of log.events || []) {
      if (ev.type === 'reading') {
        const k = ev.entryTime || ev.createdAt || '';
        if (!readingByTime.has(k)) readingByTime.set(k, []);
        readingByTime.get(k)!.push(ev);
      } else {
        list.push({ kind: 'event', time: ev.createdAt || '', event: ev });
      }
    }
    for (const [time, evs] of readingByTime.entries()) {
      if (evs.length > 1) list.push({ kind: 'merged-reading', time, events: evs });
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
              : 'correction';
      return k === filter;
    });
  }, [items, filter]);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const it of filtered) {
      const key = it.kind === 'event' ? (it.event.date || '') : (log?.date || '');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(k => ({ label: k || 'نامشخص', items: map.get(k)! }));
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
  const latestItemId = items.length > 0 && items[0].kind !== 'merged-reading' ? (items[0].kind === 'event' ? items[0].event.id : items[0].correction.id) : null;

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
    <Modal open={open} onClose={onClose} title={`📜 تاریخچه — ${toFa(log.date)}${log.entryTime ? ' • ' + toFa(log.entryTime) : ''}`}
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
            <div key={group.label} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', paddingBottom: 6, marginBottom: 6, borderBottom: '1px dashed var(--border)' }}>
                📅 {group.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.items.map((it) => {
                  if (it.kind === 'merged-reading') {
                    return <MergedReadingRow key={it.events[0].id} time={it.time} events={it.events} />;
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

  const meta = TYPE_META[ev.type];
  const isRevoked = ev.revoked === true;
  const time = ev.entryTime || (ev.createdAt ? ev.createdAt.slice(11, 16) : '—');
  
  let label = '';
  let mainVal: string | null = null;
  let beforeVal: string | null = null;
  let afterVal: string | null = null;

  if (ev.before !== undefined && ev.after !== undefined) {
    label = FIELD_LABEL[ev.field || ''] || ev.field || 'مقدار';
    beforeVal = String(ev.before ?? '—');
    afterVal = String(ev.after ?? '—');
  } else if (ev.type === 'water' && ev.amount !== undefined) {
    label = 'مصرف آب';
    mainVal = `${toFa(ev.amount)} لیتر`;
  } else if (ev.type === 'feed' && ev.amount !== undefined) {
    label = 'مصرف دان';
    mainVal = `${toFa(ev.amount)} کیلوگرم`;
  } else if (ev.type === 'death' && ev.count !== undefined) {
    label = 'تلفات';
    mainVal = `${toFa(ev.count)} عدد`;
  } else if (ev.type === 'vaccine') {
    label = 'واکسن';
    mainVal = ev.notes || ev.reason || 'ثبت شده';
  } else if (ev.type === 'medication') {
    label = 'دارو';
    mainVal = ev.notes || ev.reason || 'ثبت شده';
  } else if (ev.field) {
    label = FIELD_LABEL[ev.field] || ev.field;
    mainVal = `${toFa(ev.value ?? 0)}`;
  } else if (ev.value !== undefined && ev.value !== null) {
    label = 'مقدار';
    mainVal = `${toFa(ev.value)}`;
  }

  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      opacity: isRevoked ? 0.7 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b style={{ color: meta.tone, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{meta.label}</b>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(time)}</span>
        </div>
        {isRevoked && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--danger)' }}>لغو شده</span>}
      </div>

      {label && (
        <Row
          l={label}
          v={
            beforeVal !== null && afterVal !== null ? (
              <span style={{ fontFamily: 'monospace' }}>
                <span style={{ color: 'var(--danger)' }}>{toFa(beforeVal)}</span>
                <span style={{ color: 'var(--muted)', margin: '0 6px' }}>←</span>
                <span style={{ color: 'var(--accent)' }}>{toFa(afterVal)}</span>
              </span>
            ) : (
              <span style={{ fontFamily: 'monospace', color: meta.tone }}>{mainVal}</span>
            )
          }
        />
      )}

      {ev.reason && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>دلیل:</span>
          <span>{ev.reason}</span>
        </div>
      )}

      {isLatest && !isRevoked && ev.type !== 'create' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <button
            type="button"
            onClick={onRevoke}
            style={{
              padding: '2px 8px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-2xs)', color: 'var(--danger)', cursor: 'pointer'
            }}
          >لغو</button>
        </div>
      )}
    </div>
  );
}

function CorrectionRow({ corr, log, isLatest, onRevoke }: { corr: NonNullable<DailyLog['corrections']>[number]; log: DailyLog; isLatest: boolean; onRevoke: () => void }) {
  const isRevoked = corr.revoked === true;
  const time = corr.timestamp ? corr.timestamp.slice(11, 16) : '—';
  return (
    <div style={{
      padding: '10px 12px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--border)',
      opacity: isRevoked ? 0.7 : 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>اصلاح دستی</b>
          <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(time)}</span>
        </div>
        {isRevoked && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--danger)' }}>لغو شده</span>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Object.keys(corr.changes).map(k => {
          const before = (log as any)[k];
          const after = (corr.changes as any)[k];
          return (
            <Row
              key={k}
              l={FIELD_LABEL[k] || k}
              v={
                <span style={{ fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--danger)' }}>{toFa(String(before ?? '—'))}</span>
                  <span style={{ color: 'var(--muted)', margin: '0 6px' }}>←</span>
                  <span style={{ color: 'var(--accent)' }}>{toFa(String(after ?? '—'))}</span>
                </span>
              }
            />
          );
        })}
      </div>

      {corr.reason && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 4 }}>
          <span style={{ fontWeight: 600 }}>دلیل:</span>
          <span>{corr.reason}</span>
        </div>
      )}

      {isLatest && !isRevoked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2 }}>
          <button
            type="button"
            onClick={onRevoke}
            style={{
              padding: '2px 8px', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-2xs)', color: 'var(--danger)', cursor: 'pointer'
            }}
          >لغو</button>
        </div>
      )}
    </div>
  );
}


function MergedReadingRow({ time, events }: { time: string; events: DlgEvent[] }) {
  const timeStr = events[0].entryTime || (time ? time.slice(11, 16) : '—');
  return (
    <div style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px', background: 'var(--input-bg)', borderBottom: '1px dashed var(--border)' }}>
        <span style={{ color: 'var(--info)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>اندازه‌گیری محیط</span>
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.5px' }}>{toFa(timeStr)}</span>
      </div>
      <div style={{ padding: '4px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
