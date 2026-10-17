/**
 * PickHatchModal.tsx — انتخاب هچ از inc
 * auto-fill: تعداد اولیه، تاریخ هچ، پرنده، نژاد
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useInc } from '../../inc/store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (hatch: any, eggEntry: any | null) => void;
}

export default function PickHatchModal({ open, onClose, onSelect }: Props) {
  const hatches = useInc(s => s.hatches);
  const eggEntries = useInc(s => s.eggEntries);
  const devices = useInc(s => s.devices);

  // هچ‌های تبدیل‌نشده به گله
  const availableHatches = useMemo(() => {
    return (hatches || [])
      .filter((h: any) => !h.generatedFlockId && (h.hatched || 0) > 0)
      .slice()
      .sort((a: any, b: any) => (b.date || '').localeCompare(a.date || ''));
  }, [hatches]);

  const handlePick = (h: any) => {
    const entry = (eggEntries || []).find((e: any) => e.id === h.eggEntryId);
    onSelect(h, entry || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="🐣 انتخاب هچ (جوجه‌کشی)">
      {availableHatches.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐣</div>
          <div>هیچ هچ آماده‌ای پیدا نشد</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>ابتدا از بخش جوجه‌کشی، نتیجه هچ ثبت کنید</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {availableHatches.map((h: any) => {
            const entry = (eggEntries || []).find((e: any) => e.id === h.eggEntryId);
            const device = entry ? (devices || []).find((d: any) => d.id === entry.deviceId) : null;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handlePick(h)}
                style={{
                  padding: '10px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 3,
                  textAlign: 'right',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
                    {toFa(h.hatched || 0)} جوجه
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                    {toFa(h.date)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {device && <span>· {device.name}</span>}
                  {entry && entry.count && <span>· از {toFa(entry.count)} تخم</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}
