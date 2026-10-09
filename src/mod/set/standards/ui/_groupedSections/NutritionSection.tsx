/**
 * NutritionSection.tsx — گروه ۳: تغذیه و رشد
 *
 * شامل: خوراک (feed) + رشد (growth)
 */
import SettingsGroup from '../../../SettingsGroup';
import { FeedEditor, GrowthEditor } from '../editors';
import type { SectionProps } from './types';
import { isChanged } from './types';
import { useFormat } from '../../../../../shr/units/useFormat';

export default function NutritionSection({ std, def, updateBird }: SectionProps) {
  const fmt = useFormat();
  const feedChanged = isChanged(std.feed, def.feed);
  const growthChanged = isChanged(std.growth, def.growth);
  const changed = feedChanged || growthChanged;

  const subtitle = changed
    ? '🔸 تغییر یافته'
    : `${fmt.int(std.feed.length)} مرحله دان · ${fmt.int(std.growth.weightByAge.length)} نقطه رشد`;

  return (
    <SettingsGroup
      icon="🍽"
      title="تغذیه و رشد"
      subtitle={subtitle}
      exclusiveGroup="std-sections"
      persist={false}
      tone="purple"
    >
      {/* خوراک */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          🌾 جیره و خوراک {feedChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <FeedEditor feed={std.feed} onChange={(feed: any) => updateBird({ feed })} />
      </div>

      {/* رشد */}
      <div style={{ paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
          📈 منحنی رشد {growthChanged && <span style={{ color: 'var(--warn)' }}>🔸</span>}
        </div>
        <GrowthEditor
          growth={std.growth.weightByAge}
          onChange={(wba: any) => updateBird({ growth: { ...std.growth, weightByAge: wba } })}
        />
      </div>
    </SettingsGroup>
  );
}
