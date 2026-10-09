/**
 * EnvironmentSection.tsx — گروه ۲: محیط
 *
 * شامل: دما/رطوبت + برنامه نوری + تهویه + کیفیت آب
 */
import SettingsGroup from '../../../SettingsGroup';
import { EnvEditor, LightingEditor, VentilationEditor, WaterQualityEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged } from './types';

export default function EnvironmentSection({ std, def, updateBird }: SectionProps) {
  const envChanged = isChanged(std.env, def.env);
  const lightChanged = isChanged(std.lightingProgram, def.lightingProgram);
  const ventChanged = isChanged(std.ventilation, def.ventilation);
  const waterChanged = isChanged(std.waterQuality, def.waterQuality);

  const changed = envChanged || lightChanged || ventChanged || waterChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `${std.env.length} مرحله سنی`;

  return (
    <SettingsGroup
      icon="🌡"
      title="محیط"
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="danger"
    >
      {/* دما و رطوبت */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🌡 دما و رطوبت {envChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <EnvEditor env={std.env} onChange={(env: any) => updateBird({ env })} />
      </div>

      {/* برنامه نوری */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          💡 برنامه نوری {lightChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <LightingEditor std={std} def={def} updateBird={updateBird} />
      </div>

      {/* تهویه */}
      <div style={{ marginBottom: 12, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🌬 تهویه {ventChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <VentilationEditor std={std} def={def} updateBird={updateBird} />
      </div>

      {/* کیفیت آب (اختیاری) */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          💧 کیفیت آب (اختیاری) {waterChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <WaterQualityEditor std={std} def={def} updateBird={updateBird} />
      </div>
    </SettingsGroup>
  );
}
