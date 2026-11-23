import { useState, useMemo } from 'react';
import { useFormat } from '../../../shr/units/useFormat';
import { Modal, Input, Tag } from '../../../shr/components/ui';
import { useFlk } from '../../flk/store';
import type { Flock } from '../../flk/store';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (flock: Flock) => void;
  invoiceBirdIds?: string[];
}

export default function PickFlockModal({ open, onClose, onSelect, invoiceBirdIds = [] }: Props) {
  const fmt = useFormat();
  const { flocks } = useFlk();
  const [q, setQ] = useState('');

  const { activeFlocks, archivedFlocks } = useMemo(() => {
    const term = q.trim().toLowerCase();
    const all = (flocks || []).filter(f => {
      if (!term) return true;
      const bName = (f as any).birdName || '';
      return (
        (f.name || '').toLowerCase().includes(term) ||
        bName.toLowerCase().includes(term) ||
        (f.archivedReason || '').toLowerCase().includes(term)
      );
    });

    // اولویت‌بندی: گله‌های بدون فاکتور و هم‌گونه بالاتر قرار می‌گیرند
    const score = (f: Flock) => {
      let s = 0;
      if (!f.sourceInvoiceId) s += 10;
      if (f.birdId && invoiceBirdIds.includes(f.birdId)) s += 5;
      return s;
    };

    const active = all
      .filter(f => f.status !== 'archived' && f.status !== 'sold')
      .sort((a, b) => score(b) - score(a));

    const archived = all
      .filter(f => f.status === 'archived' || f.status === 'sold')
      .sort((a, b) => score(b) - score(a));

    return { activeFlocks: active, archivedFlocks: archived };
  }, [flocks, q, invoiceBirdIds]);

  const renderItem = (f: Flock, isArchived: boolean) => {
    const birdName = (f as any).birdName || '';
    const hasOtherInvoice = !!f.sourceInvoiceId;
    const speciesMismatch = invoiceBirdIds.length > 0 && f.birdId && !invoiceBirdIds.includes(f.birdId);

    return (
      <button
        key={f.id}
        type="button"
        onClick={() => {
          onSelect(f);
          onClose();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          width: '100%',
          padding: '10px 12px',
          background: 'var(--card-solid, #fff)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          cursor: 'pointer',
          textAlign: 'right',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
              {f.name}
            </span>
            {birdName ? <Tag tone="green">{birdName}</Tag> : null}
            {isArchived ? <Tag tone="gray">آرشیو</Tag> : null}
            {hasOtherInvoice ? <Tag tone="amber">دارای فاکتور</Tag> : null}
            {speciesMismatch ? <Tag tone="red">گونه متفاوت</Tag> : null}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
            {f.currentCount != null ? fmt.count(f.currentCount) + ' پرنده' : 'تعداد نامشخص'}
            {f.startDate ? ` • شروع: ${fmt.date(f.startDate)}` : ''}
            {isArchived && f.archivedReason ? ` • ${f.archivedReason}` : ''}
          </div>
        </div>
      </button>
    );
  };

  const isEmpty = activeFlocks.length === 0 && archivedFlocks.length === 0;

  return (
    <Modal open={open} onClose={onClose} title="اتصال دستی فاکتور به گله">
      <div style={{ marginBottom: 10 }}>
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="جستجوی نام گله یا گونه پرنده..."
        />
      </div>

      {isEmpty ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🐔</div>
          <div>هیچ گله‌ای یافت نشد</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 380, overflowY: 'auto' }}>
          {activeFlocks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)' }}>
                گله‌های فعال ({fmt.count(activeFlocks.length)})
              </div>
              {activeFlocks.map(f => renderItem(f, false))}
            </div>
          )}

          {archivedFlocks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)' }}>
                گله‌های آرشیو شده ({fmt.count(archivedFlocks.length)})
              </div>
              {archivedFlocks.map(f => renderItem(f, true))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
