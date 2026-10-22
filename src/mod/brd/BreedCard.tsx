import type { Bird, Breed } from './store';
import { toFa } from '../../shr/utils/fa';
import { getPurposeInfo, getCategoryInfo } from './_display';
import { getBirdDisplayName, getBreedDisplayName } from './_display-name';
import { getBreedFcr, resolveStandard } from './_display-values';
import EntityLink from '../../shr/components/EntityLink';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { Btn, Tag } from '../../shr/components/ui';
import { showConfirmAsync } from '../../cor/store/dialog';
import { toastMsg } from '../../cor/store/toast';
import { logAction } from '../../cor/logger/auditLog';
import { CardActions } from '../../shr/components/ui';

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

// ═══ انتخاب فیلدهای مرتبط با هدف ═══
function getRelevantFields(stdData: any, purposes: string[]): Array<{ icon: string; label: string; value: string }> {
  if (!stdData) return [];
  const fields: Array<{ icon: string; label: string; value: string }> = [];

  const hasLayer = purposes.includes('layer') || purposes.includes('breeder');
  const hasBroiler = purposes.includes('broiler');

  // 🥚 layer/breeder
  if (hasLayer) {
    if (stdData.biology?.cullDay) {
      fields.push({ icon: '⏱', label: 'چرخه', value: `${toFa(stdData.biology.cullDay)} روز` });
    }
    if (stdData.biology?.layingStartDay) {
      fields.push({ icon: '📅', label: 'شروع تخم', value: `روز ${toFa(stdData.biology.layingStartDay)}` });
    }
    if (stdData.production?.eggsPerYear) {
      fields.push({ icon: '🥚', label: 'تخم/سال', value: toFa(stdData.production.eggsPerYear) });
    }
    if (stdData.production?.fertilityPct) {
      fields.push({ icon: '🐣', label: 'باروری', value: `${toFa(stdData.production.fertilityPct)}٪` });
    }
  }

  // 🍗 broiler
  if (hasBroiler) {
    if (stdData.biology?.cullDay && !hasLayer) {
      fields.push({ icon: '⏱', label: 'چرخه', value: `${toFa(stdData.biology.cullDay)} روز` });
    }
    if (stdData.growth?.finalWeightG) {
      fields.push({ icon: '⚖️', label: 'وزن بلوغ', value: `${toFa(Math.round(stdData.growth.finalWeightG / 100) / 10)} کیلو` });
    }
    if (stdData.growth?.weightByAge?.length) {
      const last = stdData.growth.weightByAge[stdData.growth.weightByAge.length - 1];
      if (last?.adgG) fields.push({ icon: '📈', label: 'ADG', value: `${toFa(last.adgG)} گرم` });
    }
    if (stdData.mortalityTotalPct) {
      fields.push({ icon: '💀', label: 'تلفات', value: `${toFa(stdData.mortalityTotalPct)}٪` });
    }
  }

  return fields.slice(0, 4);
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

  const relevantFields = getRelevantFields(stdData, breedPurposes);

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
      {relevantFields.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> مشخصات
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {relevantFields.map((f, i) => (
              <StatRow key={i} label={`${f.icon} ${f.label}`} value={f.value} />
            ))}
          </div>
        </>
      )}

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
        <CardActions actions={[
          { label: 'ویرایش', onClick: () => onEdit(b), variant: 'outline' },
          { label: 'حذف', onClick: handleDelete, variant: 'danger' }
        ]} />
      </div>
    </ExpandableCard>
  );
}
