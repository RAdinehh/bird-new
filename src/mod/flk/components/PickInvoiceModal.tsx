/**
 * PickInvoiceModal.tsx — انتخاب فاکتور خرید پرنده از tra
 * نمایش کامل: طرف حساب، نوع پرنده، نژاد، تاریخ هچ، وضعیت اتصال
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useTra } from '../../tra/store';
import { useBrd } from '../../brd/store';
import { useCtc } from '../../ctc/store';
import { useFlk } from '../../flk/store';
import type { Invoice, InvoiceItem } from '../../tra/types';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (invoice: Invoice) => void;
  currentBirdId?: string;
}

interface FlockLite {
  id: string;
  name: string;
  sourceInvoiceId?: string;
}

export default function PickInvoiceModal({ open, onClose, onSelect, currentBirdId }: Props) {
  const invoices = useTra(s => s.invoices);
  const { contacts } = useCtc();
  const { flocks } = useFlk();

  const birdInvoices = useMemo(() => {
    return (invoices || [])
      .filter((inv: Invoice) => {
        if (inv.type !== 'purchase') return false;
        const hasBird = inv.items?.some((it: InvoiceItem) => {
          if (!it.birdId) return false;
          if (currentBirdId && it.birdId !== currentBirdId) return false;
          return true;
        });
        return hasBird;
      })
      .slice()
      .sort((a: Invoice, b: Invoice) => (b.date || '').localeCompare(a.date || ''));
  }, [invoices, currentBirdId]);

  const flocksByInvoice = useMemo(() => {
    const map = new Map<string, FlockLite>();
    for (const f of (flocks || []) as FlockLite[]) {
      if (f.sourceInvoiceId) map.set(f.sourceInvoiceId, f);
    }
    return map;
  }, [flocks]);

  const handlePick = (inv: Invoice) => {
    onSelect(inv);
    onClose();
  };

  const getBirdName = (id?: string): string | undefined => {
    if (!id) return undefined;
    return (useBrd.getState().birds || []).find((b: { id: string; name: string }) => b.id === id)?.name;
  };
  const getBreedName = (id?: string): string | undefined => {
    if (!id) return undefined;
    return (useBrd.getState().breeds || []).find((b: { id: string; name: string }) => b.id === id)?.name;
  };
  const getPartyName = (id?: string): string | undefined => {
    if (!id) return undefined;
    const list = (contacts || []) as { id: string; name: string }[];
    return list.find(c => c.id === id)?.name;
  };

  return (
    <Modal open={open} onClose={onClose} title="📄 انتخاب فاکتور خرید پرنده">
      {birdInvoices.length === 0 ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
          <div>هیچ فاکتور خرید پرنده‌ای پیدا نشد</div>
          <div style={{ fontSize: 'var(--fs-sm)', marginTop: 4, opacity: 0.7 }}>ابتدا از بخش معاملات، فاکتور خرید پرنده ثبت کنید</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {birdInvoices.map((inv) => {
            const birdItems = (inv.items || []).filter((it: InvoiceItem) => it.birdId);
            const totalQty = birdItems.reduce((s: number, it: InvoiceItem) => s + (it.quantity || 0), 0);
            const firstBird: InvoiceItem = birdItems[0] || ({} as InvoiceItem);
            const linkedFlock = flocksByInvoice.get(inv.id);
            const isLinked = !!linkedFlock;
            const birdName = getBirdName(firstBird.birdId);
            const breedName = getBreedName(firstBird.breedId);
            const partyName = getPartyName(inv.partyId);
            const isChick = (firstBird.category || inv.category) === 'chick';

            return (
              <button
                key={inv.id}
                type="button"
                onClick={() => handlePick(inv)}
                style={{
                  padding: '10px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: 6,
                  textAlign: 'right',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  width: '100%',
                }}
              >
                {/* ردیف ۱: طرف حساب + وضعیت اتصال */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                    {partyName || '—'}
                  </span>
                  {isLinked ? (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      🔗 {linkedFlock.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--input-bg)', color: 'var(--muted)', fontWeight: 700 }}>
                      بدون گله
                    </span>
                  )}
                </div>

                {/* ردیف ۲: نوع پرنده + نژاد + شماره فاکتور */}
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {isChick ? '🐣' : '🐔'} {birdName || '—'}
                  </span>
                  {breedName && <span>· {breedName}</span>}
                  {inv.number && <span>· #{inv.number}</span>}
                </div>

                {/* ردیف ۳: تعداد + مبلغ + تاریخ هچ + تاریخ فاکتور */}
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
                    {toFa(totalQty)} پرنده
                  </span>
                  {inv.total > 0 && <span>· {toFa(Math.round(inv.total).toLocaleString('fa-IR'))} ت</span>}
                  {firstBird.hatchDate && <span>· هچ: {toFa(firstBird.hatchDate)}</span>}
                  <span style={{ marginInlineStart: 'auto' }}>{toFa(inv.date)}</span>
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
