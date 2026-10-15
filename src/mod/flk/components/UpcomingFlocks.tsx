/**
 * UpcomingFlocks — گله‌های نزدیک به شروع تخم‌گذاری
 * طراحی: رینگ دایره‌ای + responsive (۱-۳ تک‌ستونه · ۴+ دو‌ستونه)
 * الگو: FOUNDATION-PATTERNS ب۲۲ (KPI Cards)
 */
import { toFa } from '../../../shr/utils/fa';
import { DEFAULT_LAYING_START, getAgeDays, getLayingStartDay } from '../store';
import type { Flock } from '../store';
import type { TabId } from '../types-flocks';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import type { useFormat } from '../../../shr/units';

type BreedStd = ReturnType<typeof useBreedStandard>;
type Fmt = ReturnType<typeof useFormat>;

export interface UpcomingFlocksProps {
  flocks: Flock[];
  breedStd: BreedStd;
  fmt: Fmt;
  tab?: TabId;
}

interface RingProps {
  pct: number;
  color: string;
  size?: number;
}

function Ring({ pct, color, size = 40 }: RingProps) {
  const r = (size / 2) - 4;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, pct) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={4}
        strokeDasharray={c} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="round"
      />
      <text x={size / 2} y={size / 2 + size * 0.09} textAnchor="middle"
        fontSize={size * 0.26} fontWeight="700" fill={color}>
        {toFa(Math.round(pct))}٪
      </text>
    </svg>
  );
}

export default function UpcomingFlocks({ flocks, breedStd, fmt, tab }: UpcomingFlocksProps) {
  const upcoming = flocks
    .filter(f => {
      if (f.status !== 'active') return false;
      if (f.type !== 'layer' && f.type !== 'breeder') return false;
      // 🆕 فیلتر بر اساس tab
      if (tab === 'layer' && f.type !== 'layer') return false;
      if (tab === 'breeder' && f.type !== 'breeder') return false;
      const std = breedStd.byBreedId(f.breedId);
      const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? DEFAULT_LAYING_START);
      const age = getAgeDays(f);
      return age < startDay && age >= startDay - 60;
    })
    .sort((a, b) => getAgeDays(b) - getAgeDays(a))
    .slice(0, 12);

  if (upcoming.length === 0) return null;

  const isMulti = upcoming.length >= 4;

  const items = upcoming.map(f => {
    const age = getAgeDays(f);
    const std = breedStd.byBreedId(f.breedId);
    const startDay = getLayingStartDay(f, std?.biology?.layingStartDay ?? DEFAULT_LAYING_START);
    const remain = startDay - age;
    const pct = Math.min(100, (age / startDay) * 100);
    return { f, age, startDay, remain, pct };
  });

  return (
    <div style={{
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--pad-comfy)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 'var(--fs-md)' }} aria-hidden>⏳</span>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)', flex: 1 }}>
          نزدیک به شروع تخم‌گذاری
        </span>
        <span style={{
          fontSize: 'var(--fs-2xs)', fontWeight: 700,
          background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
          padding: '1px 7px', borderRadius: 'var(--r-sm)',
        }}>{toFa(items.length)}</span>
      </div>

      {/* Grid / List */}
      <div style={{
        display: isMulti ? 'grid' : 'flex',
        gridTemplateColumns: isMulti ? '1fr 1fr' : undefined,
        flexDirection: isMulti ? undefined : 'column',
        gap: 6,
      }}>
        {items.map(({ f, age, startDay, remain, pct }) => {
          const isWarn = remain <= 14;
          const color = isWarn ? 'var(--warn)' : 'var(--accent)';

          if (isMulti) {
            return (
              <div key={f.id} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                minWidth: 0,
                textAlign: 'center',
              }}>
                <Ring pct={pct} color={color} size={40} />
                <div style={{
                  fontSize: 'var(--fs-xs)', fontWeight: 700,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  width: '100%',
                }}>{f.name}</div>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color, lineHeight: 1.1 }}>
                  {fmt.int(remain)}
                  <div style={{ fontSize: 'var(--fs-2xs)', fontWeight: 500, color: 'var(--muted)', marginTop: 1 }}>روز مانده</div>
                </div>
              </div>
            );
          }

          return (
            <div key={f.id} style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 0,
            }}>
              <Ring pct={pct} color={color} size={40} />
              {/* (رینگ اول توی DOM = راست توی RTL) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 4,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{f.name}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span>سن: <b style={{ color: 'var(--text)' }}>{toFa(age)}</b> روز</span>
                  <span aria-hidden>·</span>
                  <span>شروع: <b style={{ color: 'var(--text)' }}>{toFa(startDay)}</b> روز</span>
                </div>
              </div>
              <div style={{
                flexShrink: 0, textAlign: 'center', lineHeight: 1.1, color,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt.int(remain)}</div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', marginTop: 2 }}>روز مانده</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
