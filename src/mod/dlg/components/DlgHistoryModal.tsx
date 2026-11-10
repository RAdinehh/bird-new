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
  | { kind: 'correction'; time: string; correction: NonNullable<DailyLog['corrections']>[number] };

export default function DlgHistoryModal({ open, onClose, log }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
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
    <Modal open={open} onClose={onClose} title={`📜 تاریخچه — ${toFa(log.date)}${log.entryTime ? ' • ' + toFa(log.entryTime) : ''}`}
      footer={<BtnRow><Btn onClick={handleExport}>📥 CSV</Btn><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      {/* ═══ هدر خلاصه سبز ═══ */}
      <div style={{
        padding: '10px 12px',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
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
              padding: '10px 12px', background: filter === 'all' ? 'var(--accent-soft)' : 'var(--card)',
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
                  padding: '10px 12px', background: isActive ? 'var(--accent-soft)' : 'var(--card)',
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
  
  let mainValue: string | null = null;
  if (hasBeforeAfter) {
    mainValue = `${toFa(String(ev.before ?? '—'))} → ${toFa(String(ev.after ?? '—'))}`;
  } else if (ev.value !== undefined && ev.value !== null) {
    mainValue = `${toFa(ev.value)}`;
  } else if (ev.amount !== undefined) {
    mainValue = `${toFa(ev.amount)} ${ev.unit || ''}`;
  } else if (ev.count !== undefined) {
    mainValue = `${toFa(ev.count)}`;
  }

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      opacity: isRevoked ? 0.6 : 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ═══ هدر: راست (آیکون+نوع) / چپ (زمان) ═══ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--input-bg)',
        borderBottom: '1px dashed var(--border)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          
          <b style={{ color: meta.tone, fontSize: 'var(--fs-sm)' }}>{meta.label}</b>
        </span>
        <span style={{
          fontFamily: 'monospace', fontSize: 'var(--fs-xs)',
          color: 'var(--muted)', fontWeight: 700, letterSpacing: '.5px',
        }}>{toFa(time)}</span>
      </div>

      {/* ═══ بدنه: فیلد و مقدار (راست‌چین) ═══ */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {fieldLabel && mainValue && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600 }}>{fieldLabel}:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-sm)', fontWeight: 700, textAlign: 'left' }}>
              {hasBeforeAfter ? (
                <>
                  <span style={{ color: 'var(--danger)' }}>{toFa(String(ev.before ?? '—'))}</span>
                  <span style={{ color: 'var(--muted)', margin: '0 6px' }}>→</span>
                  <span style={{ color: 'var(--accent)' }}>{toFa(String(ev.after ?? '—'))}</span>
                </>
              ) : mainValue}
            </span>
          </div>
        )}
        {!fieldLabel && mainValue && (
          <div style={{ fontFamily: 'monospace', fontSize: 'var(--fs-md)', fontWeight: 700, color: meta.tone, textAlign: 'left' }}>
            {mainValue}
          </div>
        )}
        
        {ev.reason && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 4, marginTop: 2 }}>
            <span style={{ fontWeight: 600 }}>دلیل:</span>
            <span>{ev.reason}</span>
          </div>
        )}
        {ev.notes && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
            «{ev.notes}»
          </div>
        )}
      </div>

      {/* ═══ فوتر: لغو (چپ) و وضعیت ═══ */}
      {(isRevoked || (isLatest && ev.type !== 'create')) && (
        <div style={{
          padding: '6px 12px',
          borderTop: '1px dashed var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--card)',
        }}>
          {isRevoked ? (
            <span style={{ padding: '2px 8px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 4, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
              لغو شده
            </span>
          ) : <span />}
          {isLatest && !isRevoked && ev.type !== 'create' && (
            <button
              type="button"
              onClick={onRevoke}
              style={{
                padding: '4px 10px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}
            >↩️ لغو</button>
          )}
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
      background: 'var(--card)',
      border: `1px solid ${isRevoked ? 'var(--border)' : 'var(--warn)'}`,
      borderRadius: 'var(--r-md)',
      opacity: isRevoked ? 0.6 : 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* هدر */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '8px 12px',
        background: 'var(--warn-soft)',
        borderBottom: '1px dashed var(--warn)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>🔧</span>
          <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>اصلاح</b>
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.5px' }}>{toFa(time)}</span>
      </div>

      {/* بدنه: فیلدها (راست‌چین) */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.keys(corr.changes).map(k => {
          const before = (log as any)[k];
          const after = (corr.changes as any)[k];
          return (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600 }}>
                {FIELD_LABEL[k] || k}:
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-sm)', fontWeight: 700, textAlign: 'left' }}>
                <span style={{ color: 'var(--danger)' }}>{toFa(String(before ?? '—'))}</span>
                <span style={{ color: 'var(--muted)', margin: '0 6px' }}>→</span>
                <span style={{ color: 'var(--accent)' }}>{toFa(String(after ?? '—'))}</span>
              </span>
            </div>
          );
        })}
        {corr.reason && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 4, marginTop: 4 }}>
            <span style={{ fontWeight: 600 }}>دلیل:</span>
            <span>{corr.reason}</span>
          </div>
        )}
      </div>

      {/* فوتر */}
      {(isRevoked || isLatest) && (
        <div style={{
          padding: '6px 12px',
          borderTop: '1px dashed var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--card)',
        }}>
          {isRevoked ? (
            <span style={{ padding: '2px 8px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 4, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
              لغو شده
            </span>
          ) : <span />}
          {isLatest && !isRevoked && (
            <button
              type="button"
              onClick={onRevoke}
              style={{
                padding: '4px 10px', background: 'transparent',
                border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
              }}
            >↩️ لغو</button>
          )}
        </div>
      )}
    </div>
  );
}
