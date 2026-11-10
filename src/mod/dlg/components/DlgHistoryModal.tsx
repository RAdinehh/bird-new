/**
 * DlgHistoryModal.tsx — تاریخچه کامل رویدادهای یک لاگ
 * استاندارد: FlockHistoryModal (گروه‌بندی تاریخ، Chip فیلتر، لغو فقط آخرین)
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow, ShowMoreButton, Chip } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { downloadCSV } from '../../../shr/utils/export';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { useDlg, type DailyLog } from '../store';
import type { DlgEvent, DlgEventType } from '../types-events';

const TYPE_META: Record<DlgEventType, { icon: string; label: string; tone: string }> = {
  create:     { icon: '➕', label: 'ثبت اولیه',   tone: 'var(--accent)' },
  reading:    { icon: '🌡', label: 'اندازه‌گیری',  tone: 'var(--info)' },
  feed:       { icon: '🌾', label: 'دان',         tone: 'var(--warn)' },
  water:      { icon: '💧', label: 'آب',          tone: 'var(--info)' },
  death:      { icon: '💀', label: 'تلفات',        tone: 'var(--danger)' },
  egg:        { icon: '🥚', label: 'تخم',         tone: 'var(--purple)' },
  vaccine:    { icon: '💉', label: 'واکسن',        tone: 'var(--accent)' },
  medication: { icon: '💊', label: 'دارو',        tone: 'var(--warn)' },
  weight:     { icon: '⚖️', label: 'وزن',         tone: 'var(--info)' },
  correction: { icon: '🔧', label: 'اصلاح',        tone: 'var(--warn)' },
};

const FIELD_LABEL: Record<string, string> = {
  temperature: 'دما', temperatureMin: 'حداقل دما', temperatureMax: 'حداکثر دما',
  humidity: 'رطوبت', humidityMin: 'حداقل رطوبت', humidityMax: 'حداکثر رطوبت',
  eatingEggs: 'تخم خوراکی', fertileEggs: 'تخم نطفه‌دار',
  brokenEggs: 'تخم شکسته', otherEggs: 'تخم سایر',
};

const VISIBLE_LIMIT = 10;

interface Props { open: boolean; onClose: () => void; log: DailyLog | null; }

type TimelineItem =
  | { kind: 'event'; time: string; event: DlgEvent }
  | { kind: 'correction'; time: string; correction: NonNullable<DailyLog['corrections']>[number] };

export default function DlgHistoryModal({ open, onClose, log }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { revokeEvent, revokeCorrection } = useDlg();

  const items: TimelineItem[] = useMemo(() => {
    if (!log) return [];
    const list: TimelineItem[] = [];
    for (const ev of log.events || []) list.push({ kind: 'event', time: ev.createdAt || '', event: ev });
    for (const corr of log.corrections || []) list.push({ kind: 'correction', time: corr.timestamp || '', correction: corr });
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [log]);

  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) {
      const k = it.kind === 'event' ? it.event.type : 'correction';
      m.set(k, (m.get(k) || 0) + 1);
    }
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter(it => {
      const k = it.kind === 'event' ? it.event.type : 'correction';
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
  const latestItemId = items.length > 0 ? (items[0].kind === 'event' ? items[0].event.id : items[0].correction.id) : null;

  const handleExport = () => {
    if (!log) return;
    try {
      const headers = ['زمان', 'نوع', 'فیلد', 'قبل', 'بعد', 'دلیل', 'لغو شده'];
      const rows = items.map(it => {
        if (it.kind === 'event') {
          const m = TYPE_META[it.event.type];
          return [it.event.entryTime || it.event.createdAt, m.label, it.event.field || '', it.event.before ?? '', it.event.after ?? it.event.value ?? it.event.amount ?? it.event.count ?? '', it.event.reason || it.event.notes || '', it.event.revoked ? 'بله' : 'خیر'];
        }
        const c = it.correction;
        const fields = Object.keys(c.changes).map(k => `${FIELD_LABEL[k] || k}: ${(log as any)[k] ?? '—'}→${(c.changes as any)[k] ?? '—'}`).join(' • ');
        return [c.timestamp, 'اصلاح', fields, '', '', c.reason, c.revoked ? 'بله' : 'خیر'];
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
    <Modal open={open} onClose={onClose} title={`📜 تاریخچه — ${log.date}${log.entryTime ? ' • ' + log.entryTime : ''}`}
      footer={<BtnRow><Btn onClick={handleExport}>📥 CSV</Btn><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      {/* ═══ هدر خلاصه ═══ */}
      <div style={{ padding: '8px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: 8, fontSize: 'var(--fs-sm)', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>{toFa(items.length)} رویداد</span>
        <span>تاریخ ثبت: {toFa(log.date)}</span>
      </div>

      {/* ═══ Chip فیلتر ═══ */}
      {items.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>همه ({toFa(items.length)})</Chip>
          {Array.from(typeCounts.entries()).map(([type, count]) => {
            const meta = TYPE_META[type as DlgEventType] || { icon: '🔧', label: 'اصلاح', tone: 'var(--warn)' };
            return (
              <Chip key={type} active={filter === type} onClick={() => setFilter(filter === type ? 'all' : type)}>
                {meta.icon} {meta.label} ({toFa(count)})
              </Chip>
            );
          })}
        </div>
      )}

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
                {group.items.map((it, idx) => {
                  // فقط اگر این آیتم، در کل لیست (items) جدیدترین باشه، لغو داره
                  const isTrulyLatest = it.kind === 'event' 
                    ? it.event.id === latestItemId 
                    : it.correction.id === latestItemId;
                  if (it.kind === 'event') {
                    return <EventRow key={it.event.id} ev={it.event} isLatest={isTrulyLatest} onRevoke={() => handleRevokeEvent(it.event)} />;
                  }
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
  const meta = TYPE_META[ev.type];
  const isRevoked = ev.revoked === true;
  const time = ev.entryTime || (ev.createdAt ? ev.createdAt.slice(11, 16) : '—');
  const fieldLabel = ev.field ? (FIELD_LABEL[ev.field] || ev.field) : '';

  const hasBeforeAfter = ev.before !== undefined && ev.after !== undefined;

  return (
    <div style={{ padding: '8px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', opacity: isRevoked ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, minWidth: 44 }}>{toFa(time)}</span>
      <span style={{ fontSize: 18 }}>{meta.icon}</span>
      <b style={{ color: meta.tone, fontSize: 'var(--fs-sm)' }}>{meta.label}</b>
      {fieldLabel && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{fieldLabel}:</span>}
      {ev.value !== undefined && ev.value !== null && <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{toFa(ev.value)}</span>}
      {ev.amount !== undefined && <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{toFa(ev.amount)} {ev.unit || ''}</span>}
      {ev.count !== undefined && <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--danger)' }}>{toFa(ev.count)}</span>}
      
      {/* 🆕 نمایش قبل/بعد با رنگ */}
      {hasBeforeAfter && (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-sm)' }}>
          <span style={{ color: 'var(--danger)' }}>{toFa(String(ev.before ?? '—'))}</span>
          <span style={{ color: 'var(--muted)', margin: '0 4px' }}>→</span>
          <span style={{ color: 'var(--accent)' }}>{toFa(String(ev.after ?? '—'))}</span>
        </span>
      )}

      {ev.notes && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>«{ev.notes}»</span>}
      {ev.reason && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>({ev.reason})</span>}
      {isRevoked && <span style={{ padding: '1px 6px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 3, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>لغو شده</span>}
      
      <div style={{ flex: 1 }} />
      
      {/* 🆕 لغو فقط برای آخرین رویداد */}
      {isLatest && !isRevoked && ev.type !== 'create' && (
        <button type="button" onClick={onRevoke} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↩️ لغو</button>
      )}
    </div>
  );
}

function CorrectionRow({ corr, log, isLatest, onRevoke }: { corr: NonNullable<DailyLog['corrections']>[number]; log: DailyLog; isLatest: boolean; onRevoke: () => void }) {
  const isRevoked = corr.revoked === true;
  const time = corr.timestamp ? corr.timestamp.slice(11, 16) : '—';
  return (
    <div style={{ padding: '8px 10px', background: isRevoked ? 'var(--input-bg)' : 'var(--warn-soft)', border: `1px solid ${isRevoked ? 'var(--border)' : 'var(--warn)'}`, borderRadius: 'var(--r-md)', opacity: isRevoked ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, minWidth: 44 }}>{toFa(time)}</span>
      <span style={{ fontSize: 18 }}>🔧</span>
      <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>اصلاح</b>
      
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
        {Object.keys(corr.changes).map(k => {
          const before = (log as any)[k];
          const after = (corr.changes as any)[k];
          return (
            <span key={k} style={{ marginLeft: 4 }}>
              {FIELD_LABEL[k] || k}: 
              <span style={{ color: 'var(--danger)', margin: '0 2px' }}>{toFa(String(before ?? '—'))}</span>
              →
              <span style={{ color: 'var(--accent)', margin: '0 2px' }}>{toFa(String(after ?? '—'))}</span>
            </span>
          );
        })}
      </span>
      
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>({corr.reason})</span>
      {isRevoked && <span style={{ padding: '1px 6px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 3, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>لغو شده</span>}
      
      <div style={{ flex: 1 }} />
      
      {isLatest && !isRevoked && (
        <button type="button" onClick={onRevoke} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↩️ لغو</button>
      )}
    </div>
  );
}
