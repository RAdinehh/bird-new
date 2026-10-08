/**
 * StatsModal — مودال آمار داده‌ها
 */
import { Btn, Modal } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { formatSize } from '../../../shr/utils/backup';

interface Props {
  open: boolean;
  onClose: () => void;
  stats: any;
}

export default function StatsModal({ open, onClose, stats }: Props) {
  return (
    <>
      <Modal
        open={open}
        onClose={() => onClose()}
        title="📊 آمار داده‌ها"
        footer={<Btn variant="primary" full onClick={() => onClose()}>بستن</Btn>}
      >
        <div style={{
          padding: 'var(--pad-comfy)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
            حجم کل داده‌ها
          </span>
          <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>
            {formatSize(stats.totalSize)}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}>
          {stats.byModule.map((m: any) => (
            <div key={m.key} style={{
              padding: '8px 10px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-xs)',
              minWidth: 0,
            }}>
              <div style={{
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{m.label}</div>
              <div style={{
                color: 'var(--muted)',
                marginTop: 2,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 4,
              }}>
                <span>{toFa(m.records)}</span>
                <span>{formatSize(m.size)}</span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}
