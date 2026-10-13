import { useMemo } from 'react';
import type { Bird, Breed } from './store';
import { toFa } from '../../shr/utils/fa';
import { getKindInfo, getCategoryInfo } from './_display';
import { getBirdDisplayName, getBreedDisplayName } from './_display-name';
import { getBreedFcr, resolveStandard } from './_display-values';
import { getStandardFor } from '../set/standards/resolve';
import EntityLink from '../../shr/components/EntityLink';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { Btn, Tag } from '../../shr/components/ui';
import { showConfirmAsync } from '../../cor/store/dialog';
import { toastMsg } from '../../cor/store/toast';
import { logAction } from '../../cor/logger/auditLog';

interface Props {
  bird: Bird;
  index: number;
  birdBreeds: Breed[];
  isOpen: boolean;
  onToggle: () => void;
  ms: any;
  customStandards: Record<string, any> | undefined;
  customOverrides?: Record<string, any>;
  onEdit: (b: Bird) => void;
  onDelete: (id: string, item: Bird) => void;
}

/** ردیف استاندارد نمایش label/value */
function StatRow({ label, value }: { label: string; value: string }) {
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

export default function BirdCard({
  bird: b, index, birdBreeds, isOpen, onToggle, ms, customStandards, customOverrides, onEdit, onDelete,
}: Props) {
  const kind = getKindInfo((b as any).birdKind);
  const stdKey = (b as any).standardKey;
  const stdData = (stdKey && resolveStandard(stdKey, customStandards, customOverrides))
    || getStandardFor(b.name, { customStandards: customStandards || {} })
    || null;
  const category = stdData?.category ? getCategoryInfo(stdData.category) : null;

  // 🆕 اگه پرنده خودش استاندارد نداره، از نژادهاش بگیر
  const breedStandards = birdBreeds
    .map(bd => {
      const k = (bd as any).standardKey;
      const std = k ? resolveStandard(k, customStandards, customOverrides) : null;
      return std ? { key: k, std, breedName: bd.name } : null;
    })
    .filter(Boolean) as Array<{ key: string; std: any; breedName: string }>;
  const hasAnyStandard = !!stdData || breedStandards.length > 0;
  // اگه پرنده استاندارد مستقیم نداره ولی نژاد داره، نمایش از نژاد
  const displayStd = stdData || (breedStandards[0]?.std || null);
  const displayLabel = stdData
    ? (stdData.nameFa || stdData.nameEn || stdKey)
    : breedStandards.length > 0
      ? `از نژاد: ${breedStandards.map(x => x.breedName).join('، ')}`
      : '';

  // 🆕 aggregate نژادها
  const aggregate = useMemo(() => {
    const total = birdBreeds.length;
    if (total === 0) return null;

    let nativeCount = 0;
    let industrialCount = 0;
    let fancyCount = 0;
    const purposesCount: Record<string, number> = {};
    let fcrMin: number | null = null;
    let fcrMax: number | null = null;

    for (const bd of birdBreeds) {
      const std = resolveStandard((bd as any).standardKey, customStandards, customOverrides);
      const cat = std?.category;
      if (cat === 'native') nativeCount++;
      else if (cat === 'fancy') fancyCount++;
      else industrialCount++;

      const ps: string[] = (bd as any).purposes || std?.purposes || [];
      for (const pr of ps) {
        if (pr === 'dual') continue;
        purposesCount[pr] = (purposesCount[pr] || 0) + 1;
      }

      const fcr = getBreedFcr(bd, customStandards, customOverrides);
      if (fcr != null) {
        if (fcrMin === null || fcr < fcrMin) fcrMin = fcr;
        if (fcrMax === null || fcr > fcrMax) fcrMax = fcr;
      }
    }

    return { total, nativeCount, industrialCount, fancyCount, purposesCount, fcrMin, fcrMax };
  }, [birdBreeds, customStandards, customOverrides]);

  const handleDelete = async () => {
    const ok = await showConfirmAsync('تأیید حذف', 'این پرنده حذف شود؟', { danger: true });
    if (!ok) return;
    onDelete(b.id, b);
    logAction('delete', 'brd', 'حذف از پرنده و نژاد');
    toastMsg.deleted('پرنده');
  };

  return (
    <ExpandableCard
      id={b.id} ms={ms}
      accent="accent"
      index={toFa(index + 1)}
      iconEmoji={kind.emoji}
      title={getBirdDisplayName(b, customStandards)}
      subtitle=""
      isOpen={isOpen}
      onToggle={onToggle}
      badge={<Tag tone="blue">{toFa(birdBreeds.length)} نژاد</Tag>}
      stats={
        <>
                    {category && <span style={{
            padding: 'var(--pad-chip)', borderRadius: 'var(--r-md)',
            background: 'var(--accent-soft)', color: 'var(--accent)',
            fontSize: 'var(--fs-2xs)', fontWeight: 700,
          }}>{category.emoji} {category.label}</span>}
        </>
      }
    >
      {aggregate && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📊</span> خلاصه
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <StatRow label="🧬 کل نژاد" value={toFa(aggregate.total)} />
            {aggregate.nativeCount > 0 && (
              <StatRow label="🌾 بومی" value={toFa(aggregate.nativeCount)} />
            )}
            {aggregate.industrialCount > 0 && (
              <StatRow label="🏭 صنعتی" value={toFa(aggregate.industrialCount)} />
            )}
            {aggregate.fancyCount > 0 && (
              <StatRow label="🎨 تزئینی" value={toFa(aggregate.fancyCount)} />
            )}
            {aggregate.fcrMin != null && aggregate.fcrMax != null && (
              <StatRow
                label="📊 FCR"
                value={aggregate.fcrMin === aggregate.fcrMax
                  ? toFa(aggregate.fcrMin)
                  : `${toFa(aggregate.fcrMin)} - ${toFa(aggregate.fcrMax)}`}
              />
            )}
          </div>
        </>
      )}

      {birdBreeds.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
            <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🧬</span> نژادهای این پرنده
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {birdBreeds.map(bd => (
              <EntityLink
                key={bd.id}
                type="breed"
                id={bd.id}
                label={`${getBreedDisplayName(bd, customStandards)}${bd.fcr ? ` · FCR ${toFa(bd.fcr)}` : ''}`}
                badge
                badgeBg="var(--purple-soft)"
                badgeColor="var(--purple)"
              />
            ))}
          </div>
        </>
      )}

      {/* 📖 کادر استاندارد متصل */}
      {hasAnyStandard ? (
        <div style={{
          padding: 'var(--pad-box)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>📖</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 800, color: 'var(--accent)',
              display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
            }}>
              {displayLabel}
              <span style={{
                fontSize: 'var(--fs-2xs)', fontWeight: 600,
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}>
                {displayStd?.source && `📚 ${displayStd.source}`}
                {displayStd?.source && displayStd?.publishYear && ' · '}
                {displayStd?.publishYear && toFa(displayStd.publishYear)}
              </span>
            </div>
          </div>
          <div style={{
            fontSize: 'var(--fs-2xs)', fontWeight: 800,
            padding: 'var(--pad-chip-xs)', borderRadius: 'var(--r-sm)',
            background: 'var(--accent)', color: 'var(--card-solid)',
            flexShrink: 0,
          }}>متصل</div>
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        <Btn size="sm" onClick={() => onEdit(b)} style={{ flex: 1 }} aria-label={`ویرایش پرنده ${getBirdDisplayName(b, customStandards)}`}>ویرایش</Btn>
        <Btn size="sm" onClick={handleDelete} style={{ flex: 1 }} aria-label={`حذف پرنده ${getBirdDisplayName(b, customStandards)}`}>حذف</Btn>
      </div>
    </ExpandableCard>
  );
}
