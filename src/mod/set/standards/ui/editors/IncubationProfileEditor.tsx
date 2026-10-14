/**
 * IncubationProfileEditor — ویرایشگر پروفایل دما/رطوبت روز‌به‌روز
 * طبق استاندارد Ross 308 / Cobb / Aviagen
 */
import { RangeCard, CompactField, FieldsGrid } from '../components';
import type { IncubationPhase } from '../../types';

interface Props {
  profile: IncubationPhase[];
  onChange: (n: IncubationPhase[]) => void;
  setterTemp?: number;
  setterHumidity?: number;
  hatcherTemp?: number;
  hatcherHumidity?: number;
  estMinTemp?: number;
  estMaxTemp?: number;
  turningAngleDeg?: number;
  co2MaxPct?: number;
  o2MinPct?: number;
  onPatch?: (patch: { estMinTemp?: number; estMaxTemp?: number; turningAngleDeg?: number; co2MaxPct?: number; o2MinPct?: number }) => void;
}

export function IncubationProfileEditor({
  profile,
  onChange,
  setterTemp,
  setterHumidity,
  hatcherTemp,
  hatcherHumidity,
  estMinTemp,
  estMaxTemp,
  turningAngleDeg,
  co2MaxPct,
  o2MinPct,
  onPatch,
}: Props) {
  const update = (i: number, patch: Partial<IncubationPhase>) => {
    onChange(profile.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };

  const resetToDefault = () => {
    if (setterTemp === undefined || hatcherTemp === undefined) return;
    const st = setterTemp;
    const sh = setterHumidity ?? 55;
    const ht = hatcherTemp;
    const hh = hatcherHumidity ?? 65;
    onChange([
      { dayFrom: 1, dayTo: 7, temp: Math.round((st + 0.1) * 10) / 10, humidity: sh, label: 'استقرار' },
      { dayFrom: 8, dayTo: 14, temp: Math.round((st - 0.1) * 10) / 10, humidity: Math.max(30, sh - 2), label: 'رشد' },
      { dayFrom: 15, dayTo: 17, temp: Math.round((st - 0.3) * 10) / 10, humidity: Math.max(30, sh - 5), label: 'بلوغ' },
      { dayFrom: 18, dayTo: 21, temp: ht, humidity: hh, label: 'هچر' },
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {onPatch && (
        <RangeCard title="🎯 اهداف استاندارد (Ross 308)">
          <FieldsGrid>
            <CompactField label="حداقل EST" value={estMinTemp ?? null} onChange={(v) => onPatch({ estMinTemp: v ?? undefined })} unit="°C" isTemp={true} decimals={1} />
            <CompactField label="حداکثر EST" value={estMaxTemp ?? null} onChange={(v) => onPatch({ estMaxTemp: v ?? undefined })} unit="°C" isTemp={true} decimals={1} />
            <CompactField label="زاویه چرخش" value={turningAngleDeg ?? null} onChange={(v) => onPatch({ turningAngleDeg: v ?? undefined })} unit="°" />
            <CompactField label="حداکثر CO₂" value={co2MaxPct ?? null} onChange={(v) => onPatch({ co2MaxPct: v ?? undefined })} unit="٪" decimals={2} />
            <CompactField label="حداقل O₂" value={o2MinPct ?? null} onChange={(v) => onPatch({ o2MinPct: v ?? undefined })} unit="٪" decimals={1} />
          </FieldsGrid>
        </RangeCard>
      )}
      {profile.length === 0 ? (
        <div style={{
          padding: '10px 12px',
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--muted)',
          lineHeight: 1.8,
        }}>
          📋 پروفایل تعریف نشده. مقادیر ثابت دما/رطوبت استفاده می‌شود.
          {setterTemp !== undefined && (
            <>
              {' '}
              <button
                type="button"
                onClick={resetToDefault}
                style={{
                  padding: '4px 10px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--accent)',
                  fontSize: 'var(--fs-xs)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🌱 پروفایل پیش‌فرض Ross
              </button>
            </>
          )}
        </div>
      ) : (
        profile.map((p, i) => (
          <RangeCard
            key={i}
            title={`روز ${p.dayFrom} تا ${p.dayTo}${p.label ? ' — ' + p.label : ''}`}
          >
            <FieldsGrid>
              <CompactField
                label="از روز"
                value={p.dayFrom}
                onChange={(v) => update(i, { dayFrom: v ?? 0 })}
                unit="روز"
              />
              <CompactField
                label="تا روز"
                value={p.dayTo}
                onChange={(v) => update(i, { dayTo: v ?? 0 })}
                unit="روز"
              />
              <CompactField
                label="🌡 دما"
                value={p.temp}
                onChange={(v) => update(i, { temp: v ?? 0 })}
                unit="°C"
                isTemp={true}
                decimals={1}
              />
              <CompactField
                label="💧 رطوبت"
                value={p.humidity}
                onChange={(v) => update(i, { humidity: v ?? 0 })}
                unit="٪"
              />
            </FieldsGrid>
          </RangeCard>
        ))
      )}
    </div>
  );
}
