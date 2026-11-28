/**
 * helpers.tsx — ماژول whs
 */
import { getGlobalFormat } from '../../shr/units/useFormat';

import type { ReactNode, CSSProperties } from 'react';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { CATEGORY_ICON, type Item } from './store';
export { Row } from '../../shr/components/ui';


export { SectionTitle } from '../../shr/components/ui';

export { chipStyle as chip } from '../../shr/utils/chipStyle';

export function WarningGroup({ title, icon, color, items, renderLine }: {
  title: string;
  icon: string;
  color: 'red' | 'amber';
  items: Item[];
  renderLine: (it: Item) => string;
}) {
  const tone: 'red' | 'amber' = color;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 'var(--fs-lg)' }}>{icon}</span>
        <div style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
        <Tag tone={tone}>{getGlobalFormat().count(items.length)}</Tag>
      </div>

      {items.map(it => (
        <div
          key={it.id}
          style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{ fontSize: 'var(--fs-md)', flexShrink: 0 }}>{CATEGORY_ICON[it.category]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              {it.name}
            </div>
            <div style={{
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
              whiteSpace: 'nowrap',
            }}>
              {renderLine(it)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


/** انتخاب هوشمند آیکون SVG اختصاصی بر اساس نام و دسته کالا */
export function getWhsItemIcon(name: string, category: string, fallback?: string): string {
  const n = (name || '').toLowerCase();
  // خوراک و مکمل‌ها
  if (/پرمیکس|پریمیکس|ویتامین|premix/.test(n)) return 'premix';
  if (/لیزین|متیونین|ترئونین|آمینو|amino|lysine|methionine/.test(n)) return 'amino_acid';
  if (/روغن|oil/.test(n)) return 'oil';
  if (/ذرت|corn/.test(n)) return 'corn';
  if (/سبوس|bran/i.test(n)) return 'bran';
  if (/گندم|wheat/i.test(n)) return 'wheat';
  if (n.trim() === 'جو' || /(?:^|\s|\u200c)جو(?:$|\s|\u200c)|barley/i.test(n)) return 'barley';
  if (/سویا|soy/.test(n)) return 'soybean_meal';
  if (/کلزا|کانولا|canola/.test(n)) return 'canola_meal';
  if (/آفتابگردان|sunflower/.test(n)) return 'sunflower_meal';
  if (/کنجد|sesame/.test(n)) return 'sesame_meal';
  if (/پودر ماهی|fish/.test(n)) return 'fish_meal';
  if (/یونجه|alfalfa/.test(n)) return 'alfalfa';
  if (/صدف|oyster/.test(n)) return 'oyster_shell';
  if (/بی‌کربنات|جوش شیرین|bicarbonate/.test(n)) return 'calcium_bicarbonate';
  if (/کلسیم|آهک|دی‌کلسیم|calcium/.test(n)) return 'calcium_powder';
  if (/سنگ\s*نمک|rock_salt/.test(n)) return 'rock_salt';
  if (/نمک|salt/.test(n)) return 'salt';
  // تجهیزات
  if (/لامپ|مهتابی|کم مصرف|led|پروژکتور/.test(n)) return /led/.test(n) ? 'lamp_led' : 'lamp_fluorescent';
  if (/هواکش|فن|اگزاست/.test(n)) return /سقفی/.test(n) ? 'fan_ceiling' : 'fan_tunnel';
  if (/دانخوری|دان‌خوری/.test(n)) return /سینی/.test(n) ? 'feeder_tray' : /زنجیر/.test(n) ? 'feeder_chain' : /سطل/.test(n) ? 'feeder_bucket' : 'feeder';
  if (/آبخوری|آب‌خوری/.test(n)) return /نیپل/.test(n) ? 'nipple' : /آویز/.test(n) ? 'drinker_hanging' : /کله‌قندی|کپسول/.test(n) ? 'drinker_capsule' : 'drinker';
  if (/هیتر|بخاری|جت/.test(n)) return /جت/.test(n) ? 'jet_heater' : 'heating';
  if (/کولر|پد سلولزی/.test(n)) return /پد/.test(n) ? 'cooling_pad' : 'swamp_cooler';
  if (/مه‌پاش|مه پاش|فوگر/.test(n)) return 'fogger';
  if (/ترازو|باسکول/.test(n)) return /باسکول/.test(n) ? 'platform_scale' : 'scale';
  if (/سمپاش|ضدعفونی/.test(n)) return 'sprayer';
  if (/ژنراتور|موتور برق/.test(n)) return 'generator';
  if (/دوربین/.test(n)) return 'camera';
  if (/سنسور|ترموستات/.test(n)) return 'sensor';
  if (/قفس/.test(n)) return 'cage';
  // بستر
  if (/پوشال|اره|خاک اره/.test(n)) return 'litter_sawdust';
  if (/کلش|کاه/.test(n)) return 'litter_straw';
  if (/پوسته برنج/.test(n)) return 'litter_rice_hull';
  // پیش‌فرض دسته
  const catMap: Record<string, string> = {
    egg: 'egg', feed: 'feed', medicine: 'meds', vaccine: 'vet_injection',
    herbal: 'herbal', equipment: 'equipment', consumable: 'inventory',
    manure: 'manure', broken: 'broken_egg',
  };
  return catMap[category] || fallback || 'inventory';
}
