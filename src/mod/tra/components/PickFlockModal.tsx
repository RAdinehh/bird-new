import { useState, useMemo } from 'react';
import { useFormat } from '../../../shr/units/useFormat';
import { Input, Tag } from '../../../shr/components/ui';
import SelectSheetShell, { SheetGroup } from '../../../shr/components/SelectSheetShell';
import { useFlk } from '../../flk/store';
import { useBrd } from '../../brd/store';
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
  const birds = useBrd(s => s.birds);
  const breeds = useBrd(s => s.breeds);
  const [q, setQ] = useState('');

  const birdMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of (birds || [])) m.set(b.id, b.name);
    return m;
  }, [birds]);

  const breedMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of (breeds || [])) m.set(b.id, b.name);
    return m;
  }, [breeds]);

  const allFlocks = flocks || [];

  const { activeFlocks, archivedFlocks } = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = allFlocks.filter(f => {
      if (!term) return true;
      const bName = (f.birdId && birdMap.get(f.birdId)) || (f as any).birdName || '';
      const brName = (f.breedId && breedMap.get(f.breedId)) || '';
      return (
        (f.name || '').toLowerCase().includes(term) ||
        bName.toLowerCase().includes(term) ||
        brName.toLowerCase().includes(term)
      );
    });

    const score = (f: Flock) => {
      let s = 0;
      if (!f.sourceInvoiceId) s += 10;
      if (f.birdId && invoiceBirdIds.includes(f.birdId)) s += 5;
      return s;
    };

    return {
      activeFlocks: filtered
        .filter(f => f.status !== 'archived' && f.status !== 'sold')
        .sort((a, b) => score(b) - score(a)),
      archivedFlocks: filtered
        .filter(f => f.status === 'archived' || f.status === 'sold')
        .sort((a, b) => score(b) - score(a)),
    };
  }, [allFlocks, q, birdMap, breedMap, invoiceBirdIds]);

  const handleClose = () => {
    setQ('');
    onClose();
  };

  const renderItem = (f: Flock, isArchived: boolean) => {
    const birdName = (f.birdId && birdMap.get(f.birdId)) || (f as any).birdName || '';
    const breedName = (f.breedId && breedMap.get(f.breedId)) || '';
    const speciesLabel = [birdName, breedName].filter(Boolean).join(' — ');
    const hasOtherInvoice = !!f.sourceInvoiceId;
    const speciesMismatch = invoiceBirdIds.length > 0 && !!f.birdId && !invoiceBirdIds.includes(f.birdId);

    const metaParts: string[] = [];
    if (speciesLabel) metaParts.push(speciesLabel);
    if (f.currentCount != null) metaParts.push(`${fmt.count(f.currentCount)} پرنده`);
    if (f.startDate) metaParts.push(`شروع: ${fmt.date(f.startDate)}`);

    return (
      <button
        key={f.id}
        type="button"
        onClick={() => {
          onSelect(f);
          handleClose();
        }}
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
        {/* ردیف ۱: نام گله + وضعیت */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
            {f.name}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {speciesMismatch ? <Tag tone="red">گونه متفاوت</Tag> : null}
            {hasOtherInvoice ? (
              <Tag tone="green">دارای فاکتور</Tag>
            ) : (
              <Tag tone="amber">بدون فاکتور</Tag>
            )}
            {isArchived ? <Tag tone="gray">آرشیو</Tag> : null}
          </div>
        </div>

        {/* ردیف ۲: جزئیات خلاصه */}
        {metaParts.length > 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {metaParts.join(' • ')}
          </div>
        )}
      </button>
    );
  };

  const totalCount = activeFlocks.length + archivedFlocks.length;
  const isEmpty = totalCount === 0;

  return (
    <SelectSheetShell
      open={open}
      onClose={handleClose}
      title="انتخاب گله"
      subtitle={allFlocks.length > 0 ? `${fmt.count(totalCount)} مورد` : undefined}
      searchable={allFlocks.length > 0}
      onSearchClear={() => setQ('')}
      searchNode={
        <Input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="جستجو..."
          autoFocus
        />
      }
    >
      {isEmpty ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🐔</div>
          <div>هیچ گله‌ای پیدا نشد</div>
          <div style={{ fontSize: 'var(--fs-sm)', marginTop: 4, opacity: 0.7 }}>
            {q.trim() ? 'عبارت جستجو را تغییر دهید' : 'ابتدا از بخش گله‌ها، یک گله ثبت کنید'}
          </div>
        </div>
      ) : (
        <>
          {activeFlocks.length > 0 && (
            <SheetGroup title="گله‌های فعال" icon="🐔" count={activeFlocks.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                {activeFlocks.map(f => renderItem(f, false))}
              </div>
            </SheetGroup>
          )}

          {archivedFlocks.length > 0 && (
            <SheetGroup title="گله‌های آرشیو شده" icon="📦" count={archivedFlocks.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                {archivedFlocks.map(f => renderItem(f, true))}
              </div>
            </SheetGroup>
          )}
        </>
      )}
    </SelectSheetShell>
  );
}
