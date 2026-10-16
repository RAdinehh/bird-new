/**
 * IdentitySection.tsx — گروه ۱: شناسه نژاد
 *
 * همه فیلدها با OverridableField
 */
import SettingsGroup from '../../../SettingsGroup';
import type { SectionProps } from './types';
import { isChanged } from './types';
import OverridableField from './OverridableField';

export default function IdentitySection({ std, def, updateBird, overrides, setOverride, clearOverride }: SectionProps) {
  const changed =
    isChanged(std.nameFa, def.nameFa) ||
    isChanged(std.nameEn, def.nameEn) ||
    isChanged(std.birdName, def.birdName) ||
    isChanged(std.source, def.source) ||
    isChanged(std.publishYear, def.publishYear) ||
    isChanged(std.notes, def.notes);

  const onOver = (path: string) => (v: any) => setOverride?.(path, v);
  const onReset = (path: string) => () => clearOverride?.(path);

  return (
    <SettingsGroup
      icon="📝"
      title="شناسه نژاد"
      subtitle={changed ? '🔸 تغییر یافته' : `${std.nameFa} • ${std.birdName}`}
      exclusiveGroup="std-sections"
      persist={false}
      tone="info"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <OverridableField
          label="نام فارسی"
          value={std.nameFa}
          defaultValue={def.nameFa}
          type="text"
          onOverride={onOver('nameFa')}
          onClear={onReset('nameFa')}
        />
        <OverridableField
          label="نام انگلیسی"
          value={std.nameEn}
          defaultValue={def.nameEn}
          type="text"
          onOverride={onOver('nameEn')}
          onClear={onReset('nameEn')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <OverridableField
          label="پرنده مادر"
          value={std.birdName}
          defaultValue={def.birdName}
          type="text"
          onOverride={onOver('birdName')}
          onClear={onReset('birdName')}
        />
        <OverridableField
          label="منبع علمی"
          value={std.source || ''}
          defaultValue={def.source || ''}
          type="text"
          placeholder="مثلاً: Aviagen 2024"
          onOverride={onOver('source')}
          onClear={onReset('source')}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <OverridableField
          label="سال انتشار"
          value={std.publishYear}
          defaultValue={def.publishYear}
          type="number"
          min={1300} max={1500}
          noSeparator
          onOverride={onOver('publishYear')}
          onClear={onReset('publishYear')}
        />
        <div /> {/* spacer */}
      </div>

      {/* یادداشت — textarea */}
      <div style={{ marginTop: 10 }}>
        <div style={{
          fontSize: 11.5, color: 'var(--muted)', fontWeight: 600,
          marginBottom: 4,
        }}>یادداشت</div>
        <textarea
          value={std.notes || ''}
          onChange={e => updateBird({ notes: e.target.value || undefined })}
          rows={2}
          placeholder="توضیحات آزاد..."
          style={{
            width: '100%',
            minHeight: 60,
            padding: '8px 12px',
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            outline: 'none',
            boxSizing: 'border-box',
            direction: 'rtl',
            textAlign: 'right',
            resize: 'vertical',
          }}
        />
      </div>
    </SettingsGroup>
  );
}
