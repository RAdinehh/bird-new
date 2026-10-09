import { RangeCard, CompactField, FieldsGrid } from '../components';
import { useFormat } from '../../../../../shr/units/useFormat';
import type { FeedRange } from '../../types';

export function FeedEditor({
  feed, onChange,
}: {
  feed: FeedRange[];
  onChange: (n: FeedRange[]) => void;
}) {
  const fmt = useFormat();
  const update = (i: number, patch: Partial<FeedRange>) => {
    onChange(feed.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {feed.map((r, i) => (
        <RangeCard
          key={i}
          title={
            r.phaseName
              ? `${r.phaseName} · روز ${fmt.int(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : fmt.int(r.dayTo)}`
              : `روز ${fmt.int(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : fmt.int(r.dayTo)}`
          }
        >
          <FieldsGrid>
            <CompactField
              label="🌾 دان"
              value={r.feedG}
              onChange={v => update(i, { feedG: v ?? 0 })}
              unit="گرم"
            />
            <CompactField
              label="💧 آب"
              value={r.waterMl}
              onChange={v => update(i, { waterMl: v ?? 0 })}
              unit="ml"
            />
            <CompactField
              decimals={2}
          label="🥩 پروتئین"
              value={r.proteinPct ?? null}
              onChange={v => update(i, { proteinPct: v ?? undefined })}
              unit="٪"
            />
            <CompactField
              label="⚡ انرژی"
              value={r.energyKcal ?? null}
              onChange={v => update(i, { energyKcal: v ?? undefined })}
              unit="kcal"
            />
          </FieldsGrid>
          {(r.lysinePct != null || r.methioninePct != null || r.calciumPct != null || r.availablePhosphorusPct != null) && (
            <FieldsGrid>
              <CompactField
                decimals={2}
          label="لیزین"
                value={r.lysinePct ?? null}
                onChange={v => update(i, { lysinePct: v ?? undefined })}
                unit="٪"
              />
              <CompactField
                decimals={2}
          label="متیونین"
                value={r.methioninePct ?? null}
                onChange={v => update(i, { methioninePct: v ?? undefined })}
                unit="٪"
              />
              <CompactField
                decimals={2}
          label="کلسیم"
                value={r.calciumPct ?? null}
                onChange={v => update(i, { calciumPct: v ?? undefined })}
                unit="٪"
              />
              <CompactField
                decimals={2}
          label="فسفر قابل جذب"
                value={r.availablePhosphorusPct ?? null}
                onChange={v => update(i, { availablePhosphorusPct: v ?? undefined })}
                unit="٪"
              />
            </FieldsGrid>
          )}
          {r.mainIngredients && r.mainIngredients.length > 0 && (
            <div style={{
              marginTop: 6,
              padding: '6px 10px',
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-sm)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              lineHeight: 1.8,
            }}>
              <b style={{ color: 'var(--text)' }}>مواد اصلی:</b>{' '}
              {r.mainIngredients.join(' · ')}
            </div>
          )}
        </RangeCard>
      ))}
    </div>
  );
}