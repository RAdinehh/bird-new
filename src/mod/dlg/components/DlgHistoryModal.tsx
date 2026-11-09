/**
 * DlgHistoryModal.tsx — تاریخچه کامل رویدادهای یک لاگ
 * الگو: flk/components/FlockHistoryModal.tsx
 *
 * همهٔ events (create/reading/feed/water/death/egg/vaccine/medication/weight/correction)
 * + corrections[] قدیمی، همه در یک تایم‌لاین.
 */
import { useMemo, useState } from 'react';
import { Modal, Btn, BtnRow, TabButton, ShowMoreButton } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { downloadCSV } from '../../../shr/utils/export';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { useDlg, type DailyLog } from '../store';
import type { DlgEvent, DlgEventType } from '../types-events';
import CorrectionModal from './CorrectionModal';

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

interface Props {
  open: boolean;
  onClose: () => void;
  log: DailyLog | null;
}

type TimelineItem =
  | { kind: 'event'; time: string; event: DlgEvent }
  | { kind: 'correction'; time: string; correction: NonNullable<DailyLog['corrections']>[number] };

export default function DlgHistoryModal({ open, onClose, log }: Props) {
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const { addCorrection, revokeEvent, revokeCorrection } = useDlg();

  const items: TimelineItem[] = useMemo(() => {
    if (!log) return [];
    const list: TimelineItem[] = [];
    for (const ev of log.events || []) {
      list.push({ kind: 'event', time: ev.createdAt || '', event: ev });
    }
    for (const corr of log.corrections || []) {
      list.push({ kind: 'correction', time: corr.timestamp || '', correction: corr });
    }
    return list.sort((a, b) => b.time.localeCompare(a.time));
  }, [log]);

  const visible = showAll ? items : items.slice(0, VISIBLE_LIMIT);
  const hidden = items.length - visible.length;

  const handleExport = () => {
    if (!log) return;
    try {
      const headers = ['زمان', 'نوع', 'فیلد', 'قبل', 'بعد', 'دلیل', 'لغو شده'];
      const rows = items.map(it => {
        if (it.kind === 'event') {
          const m = TYPE_META[it.event.type];
          return [
            it.event.entryTime || it.event.createdAt,
            m.label,
            it.event.field || '',
            it.event.before ?? '',
            it.event.after ?? it.event.value ?? it.event.amount ?? it.event.count ?? '',
            it.event.reason || it.event.notes || '',
            it.event.revoked ? 'بله' : 'خیر',
          ];
        }
        const c = it.correction;
        const fields = Object.keys(c.changes).map(k => {
          const oldVal = (log as any)[k];
          const newVal = (c.changes as any)[k];
          return `${FIELD_LABEL[k] || k}: ${oldVal ?? '—'}→${newVal ?? '—'}`;
        }).join(' • ');
        return [c.timestamp, 'اصلاح', fields, '', '', c.reason, c.revoked ? 'بله' : 'خیر'];
      });
      const csv = [headers.join(','), ...rows.map(r => r.map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))].join('\n');
      downloadCSV(`dlg-${log.id}.csv`, '\uFEFF' + csv);
      toastMsg.success('CSV دانلود شد');
    } catch {
      toastMsg.error('دانلود ناموفق');
    }
  };

  const handleRevokeEvent = async (ev: DlgEvent) => {
    if (!log) return;
    const ok = await showConfirmAsync('لغو رویداد', 'این رویداد لغو شود؟');
    if (!ok) return;
    revokeEvent(log.id, ev.id);
  };

  const handleRevokeCorrection = async (corrId: string) => {
    if (!log) return;
    const ok = await showConfirmAsync('لغو اصلاح', 'این اصلاح لغو شود؟');
    if (!ok) return;
    revokeCorrection(log.id, corrId);
  };

  const handleSaveCorrection = (logId: string, changes: Partial<DailyLog>, reason: string, notes?: string) => {
    addCorrection(logId, changes, reason, notes);
    toastMsg.saved('اصلاح');
    setCorrectionOpen(false);
  };

  if (!log) return null;

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`📜 تاریخچه — ${log.date}${log.entryTime ? ' • ' + log.entryTime : ''}`}
        footer={
          <BtnRow>
            <Btn onClick={handleExport}>📥 CSV</Btn>
            <Btn onClick={onClose}>بستن</Btn>
          </BtnRow>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
            {toFa(items.length)} رویداد
          </span>
          <Btn
            size="sm"
            variant="outline"
            onClick={() => setCorrectionOpen(true)}
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)', borderWidth: 1.5, fontWeight: 700 }}
          >
            + ثبت اصلاح
          </Btn>
        </div>

        {items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
            <div>هنوز رویدادی ثبت نشده</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {visible.map(it => it.kind === 'event' ? (
              <EventRow key={it.event.id} ev={it.event} onRevoke={() => handleRevokeEvent(it.event)} />
            ) : (
              <CorrectionRow
                key={it.correction.id}
                corr={it.correction}
                log={log}
                onRevoke={() => handleRevokeCorrection(it.correction.id)}
              />
            ))}
          </div>
        )}

        {hidden > 0 && <div style={{ marginTop: 10 }}><ShowMoreButton count={hidden} onClick={() => setShowAll(true)} /></div>}
      </Modal>

      <CorrectionModal
        open={correctionOpen}
        onClose={() => setCorrectionOpen(false)}
        log={log}
        onSave={handleSaveCorrection}
      />
    </>
  );
}

function EventRow({ ev, onRevoke }: { ev: DlgEvent; onRevoke: () => void }) {
  const meta = TYPE_META[ev.type];
  const isRevoked = ev.revoked === true;
  const time = ev.entryTime || (ev.createdAt ? ev.createdAt.slice(11, 16) : '—');
  const fieldLabel = ev.field ? (FIELD_LABEL[ev.field] || ev.field) : '';

  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--input-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)',
      opacity: isRevoked ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, minWidth: 44 }}>
        {toFa(time)}
      </span>
      <span style={{ fontSize: 18 }}>{meta.icon}</span>
      <b style={{ color: meta.tone, fontSize: 'var(--fs-sm)' }}>{meta.label}</b>
      {fieldLabel && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{fieldLabel}:</span>}
      {ev.value !== undefined && ev.value !== null && (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text)' }}>{toFa(ev.value)}</span>
      )}
      {ev.amount !== undefined && (
        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{toFa(ev.amount)} {ev.unit || ''}</span>
      )}
      {ev.count !== undefined && (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--danger)' }}>{toFa(ev.count)}</span>
      )}
      {ev.before !== undefined && ev.after !== undefined && (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-sm)' }}>
          {toFa(String(ev.before ?? '—'))} → {toFa(String(ev.after ?? '—'))}
        </span>
      )}
      {ev.notes && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>«{ev.notes}»</span>}
      {ev.reason && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>({ev.reason})</span>}
      {isRevoked && <span style={{ padding: '1px 6px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 3, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>لغو شده</span>}
      <div style={{ flex: 1 }} />
      {!isRevoked && ev.type !== 'create' && (
        <button type="button" onClick={onRevoke} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↩️ لغو</button>
      )}
    </div>
  );
}

function CorrectionRow({ corr, log, onRevoke }: { corr: NonNullable<DailyLog['corrections']>[number]; log: DailyLog; onRevoke: () => void }) {
  const isRevoked = corr.revoked === true;
  const time = corr.timestamp ? corr.timestamp.slice(11, 16) : '—';
  return (
    <div style={{
      padding: '8px 10px',
      background: isRevoked ? 'var(--input-bg)' : 'var(--warn-soft)',
      border: `1px solid ${isRevoked ? 'var(--border)' : 'var(--warn)'}`,
      borderRadius: 'var(--r-md)',
      opacity: isRevoked ? 0.6 : 1,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'monospace', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, minWidth: 44 }}>
        {toFa(time)}
      </span>
      <span style={{ fontSize: 18 }}>🔧</span>
      <b style={{ color: 'var(--warn)', fontSize: 'var(--fs-sm)' }}>اصلاح</b>
      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
        {Object.keys(corr.changes).map(k => {
          const oldVal = (log as any)[k];
          const newVal = (corr.changes as any)[k];
          return `${FIELD_LABEL[k] || k}: ${oldVal ?? '—'} → ${newVal ?? '—'}`;
        }).join(' • ')}
      </span>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>({corr.reason})</span>
      {isRevoked && <span style={{ padding: '1px 6px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 3, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>لغو شده</span>}
      <div style={{ flex: 1 }} />
      {!isRevoked && (
        <button type="button" onClick={onRevoke} style={{ padding: '2px 8px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}>↩️ لغو</button>
      )}
    </div>
  );
}
