/**
 * IdentitySection.tsx — گروه ۱: شناسه نژاد
 *
 * شامل: نام فارسی، نام انگلیسی، پرنده مادر، دسته، منبع، یادداشت
 */
import SettingsGroup from '../../../SettingsGroup';
import type { SectionProps } from './types';
import { isChanged } from './types';

const inputStyle = (changed: boolean) => ({
  width: '100%', height: 38, padding: '0 12px',
  background: 'var(--input-bg)',
  border: '1px solid ' + (changed ? 'var(--warn)' : 'var(--border)'),
  borderRadius: 'var(--r-md)',
  color: 'var(--text)', fontFamily: 'inherit',
  fontSize: 'var(--fs-base)', fontWeight: 600,
  textAlign: 'right' as const, outline: 'none', boxSizing: 'border-box' as const,
  direction: 'rtl' as const,
});

const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
    <label style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const G2 = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>{children}</div>
);

export default function IdentitySection({ std, def, updateBird }: SectionProps) {
  const changed =
    std.nameFa !== def.nameFa ||
    std.nameEn !== def.nameEn ||
    std.birdName !== def.birdName ||
    isChanged(std.source, def.source) ||
    isChanged(std.publishYear, def.publishYear);

  return (
    <SettingsGroup
      icon="📝"
      title="شناسه نژاد"
      subtitle={changed ? '🔸 تغییر یافته' : `${std.nameFa} · ${std.birdName}`}
      exclusiveGroup="std-sections"
      persist={false}
      tone="info"
    >
      <G2>
        <F label="نام فارسی">
          <input
            type="text"
            value={std.nameFa}
            onChange={e => updateBird({ nameFa: e.target.value })}
            style={inputStyle(std.nameFa !== def.nameFa)}
          />
        </F>
        <F label="نام انگلیسی">
          <input
            type="text"
            value={std.nameEn}
            onChange={e => updateBird({ nameEn: e.target.value })}
            dir="ltr"
            style={{ ...inputStyle(std.nameEn !== def.nameEn), textAlign: 'left' as const }}
          />
        </F>
      </G2>

      <G2>
        <F label="پرنده مادر">
          <input
            type="text"
            value={std.birdName}
            onChange={e => updateBird({ birdName: e.target.value })}
            style={inputStyle(std.birdName !== def.birdName)}
          />
        </F>
        <F label="دسته">
          <select
            value={std.category}
            onChange={e => updateBird({ category: e.target.value as any })}
            style={inputStyle(std.category !== def.category)}
          >
            <option value="native">بومی 🇮🇷</option>
            <option value="industrial">صنعتی 🔬</option>
            <option value="fancy">تزئینی 🦚</option>
          </select>
        </F>
      </G2>

      <G2>
        <F label="منبع (Source)">
          <input
            type="text"
            value={std.source || ''}
            onChange={e => updateBird({ source: e.target.value || undefined })}
            placeholder="مثلاً: Aviagen 2024"
            style={inputStyle((std.source || '') !== (def.source || ''))}
          />
        </F>
        <F label="سال انتشار">
          <input
            type="text"
            inputMode="numeric"
            value={std.publishYear ?? ''}
            onChange={e => {
              const n = parseInt(e.target.value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/\D/g, ''), 10);
              updateBird({ publishYear: isNaN(n) ? undefined : n });
            }}
            placeholder="۱۴۰۳ یا 2024"
            style={inputStyle(std.publishYear !== def.publishYear)}
          />
        </F>
      </G2>

      <F label="یادداشت">
        <textarea
          value={std.notes || ''}
          onChange={e => updateBird({ notes: e.target.value || undefined })}
          rows={2}
          placeholder="توضیحات آزاد..."
          style={{
            ...inputStyle((std.notes || '') !== (def.notes || '')),
            height: 'auto', minHeight: 50, padding: '8px 12px',
            resize: 'vertical',
          }}
        />
      </F>
    </SettingsGroup>
  );
}
