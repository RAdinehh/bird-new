import { RangeCard, CompactField, FieldsGrid } from '../components';
import { toFa } from '../../../../../shr/utils/fa';
import type { FeedRange } from '../../types';

export function FeedEditor({
  feed, onChange,
}: {
  feed: FeedRange[];
  onChange: (n: FeedRange[]) => void;
}) {
  const update = (i: number, patch: Partial<FeedRange>) => {
    onChange(feed.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {feed.map((r, i) => (
        <RangeCard
          key={i}
          title={`روز ${toFa(r.dayFrom)} تا ${r.dayTo === 9999 ? 'پایان' : toFa(r.dayTo)}`}
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
        </RangeCard>
      ))}
    </div>
  );
}
