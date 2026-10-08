/**
 * CandlingCard.tsx — کارت یک گروه کندلینگ (بر اساس ورودی تخم)
 *
 * نمایش: روزهای کندلینگ + تجمیع + نوار پیشرفت بصری
 */
import type { CandlingLike } from '../api/calc';
import { toFa } from '../../../shr/utils/fa';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard, { StatBox, Dot } from '../../../shr/components/ExpandableCard';

export interface CandlingCardProps {
  entryId: string;
  list: CandlingLike[];
  agg: { alive: number; infertile: number; dead: number; broken: number };
  total: number;
  entryTotal: number;
  fertilePercent: number;
  lossPercent: number;
  birdName?: string;
  deviceName?: string;
  entryDate?: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: (c: CandlingLike) => void;
  onNew: (entryId: string) => void;
  onDelete: (id: string) => void;
}

export default function CandlingCard(props: CandlingCardProps) {
  const {
    entryId, list, agg, total, entryTotal,
    fertilePercent, lossPercent,
    birdName, deviceName, entryDate,
    isOpen, onToggle, onEdit, onNew, onDelete,
  } = props;

  const lossTone = lossPercent > 20 ? 'danger' : lossPercent > 10 ? 'warn' : 'green';

  const handleDelete = async (c: CandlingLike) => {
    const subsequent = list.filter(x => x.stage > c.stage);
    const msg = subsequent.length > 0
      ? 'این کندلینگ و ' + toFa(subsequent.length) + ' کندلینگ بعدی حذف می‌شوند.\n\nادامه؟'
      : 'این کندلینگ حذف شود؟';
    if (await showConfirmAsync('تأیید', msg)) {
      onDelete(c.id);
      subsequent.forEach(s => onDelete(s.id));
    }
  };

  return (
    <ExpandableCard
      accent="accent"
      iconEmoji="🔍"
      title={birdName || '—'}
      subtitle={`${deviceName || '—'} · ${toFa(entryTotal)} تخم · ${toFa(entryDate || '—')}`}
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<Tag tone={lossTone}>تلفات {toFa(lossPercent.toFixed(0))}٪</Tag>}
      stats={<>
        <StatBox icon="🧬" label="نطفه" value={toFa(Math.round(fertilePercent)) + '٪'} tone="accent" />
        <Dot />
        <StatBox icon="📊" label="کندلینگ" value={toFa(list.length)} />
      </>}
    >
      {/* دکمه‌های روز */}
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span>
        {' '}کندلینگ‌های این ورودی
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {list.map(c => (
          <div key={c.id} style={{ position: 'relative' }}>
            <button
              type="button"
              aria-label={'ویرایش کندلینگ روز ' + c.stage}
              onClick={() => onEdit(c)}
              title={toFa((c as any).date)}
              style={{
                padding: '6px 12px 6px 28px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--r-sm)',
                fontSize: 'var(--fs-xs)',
                fontWeight: 700,
                color: 'var(--accent)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              ✓ روز {toFa(c.stage)}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(c)}
              title="بازگردانی و حذف بعدی‌ها"
              aria-label="حذف کندلینگ"
              style={{
                position: 'absolute',
                top: '50%',
                left: 4,
                transform: 'translateY(-50%)',
                background: 'var(--danger-soft)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: 1,
                padding: '2px 4px',
                borderRadius: 'var(--r-sm)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 16,
                height: 36,
              }}
            >✕</button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onNew(entryId)}
          style={{
            padding: 'var(--pad-tight)',
            background: 'var(--input-bg)',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            fontWeight: 700,
            color: 'var(--muted)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + کندلینگ جدید
        </button>
      </div>

      {/* تجمیع با درصد */}
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span>
        {' '}تجمیع ({toFa(list.length)} کندلینگ)
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
          <span style={{ color: 'var(--muted)' }}>🧬 نطفه‌داری</span>
          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(fertilePercent.toFixed(1))}٪</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
          <span style={{ color: 'var(--muted)' }}>📉 تلفات کل</span>
          <span style={{ fontWeight: 700, color: lossPercent > 10 ? 'var(--danger)' : 'var(--text)' }}>{toFa(lossPercent.toFixed(1))}٪</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <StatCell label="✅ سالم" value={agg.alive} />
          <StatCell label="⚪ بی‌نطفه" value={agg.infertile} />
          <StatCell label="💀 مرده" value={agg.dead} />
          <StatCell label="🥚 شکسته" value={agg.broken} />
        </div>
      </div>

      {/* نوار پیشرفت بصری */}
      {total > 0 && (
        <div style={{ display: 'flex', height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--input-bg)' }}>
          <div style={{ width: (agg.alive / total * 100) + '%', background: 'var(--accent)' }} />
          <div style={{ width: (agg.infertile / total * 100) + '%', background: 'var(--warn)' }} />
          <div style={{ width: (agg.dead / total * 100) + '%', background: 'var(--danger)' }} />
          <div style={{ width: (agg.broken / total * 100) + '%', background: 'var(--muted)' }} />
        </div>
      )}
    </ExpandableCard>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: 'var(--pad-tight)',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      fontSize: 'var(--fs-xs)',
      display: 'flex', justifyContent: 'space-between',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{toFa(value)}</span>
    </div>
  );
}
