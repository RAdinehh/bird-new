import type { Bird, Breed } from './store';
import { toFa } from '../../shr/utils/fa';
import { getPurposeInfo, getCategoryInfo } from './_display';
import { getBirdDisplayName, getBreedDisplayName } from './_display-name';
import { getBreedFcr, resolveStandard } from './_display-values';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import EntityLink from '../../shr/components/EntityLink';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { Btn, Tag } from '../../shr/components/ui';
import { showConfirmAsync } from '../../cor/store/dialog';
import { toastMsg } from '../../cor/store/toast';
import { logAction } from '../../cor/logger/auditLog';

interface Props {
  breed: Breed;
  index: number;
  bird: Bird | undefined;
  isOpen: boolean;
  onToggle: () => void;
  ms: any;
  onEdit: (b: Breed) => void;
  onDelete: (id: string, item: Breed) => void;
  customStandards?: Record<string, any>;
  customOverrides?: Record<string, any>;
}

/** ردیف استاندارد label/value */
function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
      background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}:</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export default function BreedCard({
  breed: b, index, bird, isOpen, onToggle, ms, onEdit, onDelete, customStandards, customOverrides,
}: Props) {
  const stdKey = (b as any).standardKey;
  const stdData = resolveStandard(stdKey, customStandards, customOverrides);
  const fcrValue = getBreedFcr(b, customStandards, customOverrides);
  const category = stdData?.category ? getCategoryInfo(stdData.category) : null;
  // 🆕 اول purposes کاربر، بعد از استاندارد
  const breedPurposes: string[] = Array.isArray((b as any).purposes) && (b as any).purposes.length > 0
    ? (b as any).purposes
    : (Array.isArray(stdData?.purposes) && stdData.purposes.length > 0
      ? stdData.purposes.filter((p: string) => p !== 'dual')
      : (stdData?.primaryPurpose && stdData.primaryPurpose !== 'dual' ? [stdData.primaryPurpose] : []));

  const handleDelete = async () => {
    const ok = await showConfirmAsync('تأیید حذف', 'این نژاد حذف شود؟', { danger: true });
    if (!ok) return;
    onDelete(b.id, b);
    logAction('delete', 'brd', 'حذف از پرنده و نژاد');
    toastMsg.deleted('نژاد');
  };

  return (
    <ExpandableCard
      id={b.id} ms={ms}
      accent="purple"
      index={toFa(index + 1)}
      iconEmoji="🧬"
      title={getBreedDisplayName(b, { customStandards, customOverrides })}
      subtitle=""
      isOpen={isOpen}
      onToggle={onToggle}
      badge={
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {breedPurposes.map((p: string) => {
            const info = getPurposeInfo(p);
            return info ? <Tag key={p} tone="green">{info.emoji} {info.label}</Tag> : null;
          })}
          {category && <Tag tone="blue">{category.emoji} {category.label}</Tag>}
        </div>
      }
      stats={<>
        <span>🐔 پرنده: {bird ? <b><EntityLink type="bird" id={bird.id} label={getBirdDisplayName(bird, { customStandards, customOverrides })} /></b> : <b style={{ color: 'var(--text)' }}>—</b>}</span>
        {fcrValue != null && <span>📊 FCR: <b style={{ color: 'var(--text)' }}>{toFa(fcrValue)}</b></span>}
      </>}
    >
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
        <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> مشخصات نژاد
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <StatRow label="نام نژاد" value={getBreedDisplayName(b, { customStandards, customOverrides })} />
        <StatRow label="پرنده" value={bird ? <EntityLink type="bird" id={bird.id} label={getBirdDisplayName(bird, { customStandards, customOverrides })} /> : '—'} />
        <StatRow label="FCR" value={fcrValue != null ? toFa(fcrValue) : '—'} />
      </div>

      {/* 📚 منبع استاندارد */}
      {stdData?.source && (
        <div style={{
          fontSize: 'var(--fs-2xs)',
          color: 'var(--muted)',
          fontWeight: 600,
          paddingTop: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          📚 {stdData.source}
          {stdData.publishYear && <span style={{ opacity: 0.6 }}>· {toFa(stdData.publishYear)}</span>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        <Btn size="sm" onClick={() => onEdit(b)} style={{ flex: 1 }} aria-label={`ویرایش نژاد ${getBreedDisplayName(b, { customStandards, customOverrides })}`}>ویرایش</Btn>
        <Btn size="sm" onClick={handleDelete} style={{ flex: 1 }} aria-label={`حذف نژاد ${getBreedDisplayName(b, { customStandards, customOverrides })}`}>حذف</Btn>
      </div>
    </ExpandableCard>
  );
}
