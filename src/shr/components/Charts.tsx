import React, { useState, useEffect } from 'react';
import { useSet } from '../../mod/set/store';

// hook مشترک برای lowPowerMode + prefers-reduced-motion
function useNoAnim() {
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      /* silent */
    }
  }, []);
  return !!(lowPower || prefersReduced);
}

// ═══════════════════════════════════════════════════════
// BarChart
// ═══════════════════════════════════════════════════════
interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  formatValue?: (n: number) => string;
  ariaLabel?: string;
}

export function BarChart({
  data,
  color = 'var(--accent)',
  height = 160,
  formatValue,
  ariaLabel,
}: BarChartProps) {
  const noAnim = useNoAnim();
  const max = Math.max(...data.map(d => d.value), 1);
  const total = data.reduce((a, d) => a + d.value, 0);
  const label = ariaLabel || `نمودار میلهای — ${data.length} میله، مجموع ${shortNumFa(total)}`;

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: '100%', padding: '12px 0' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height,
          padding: '0 4px',
        }}
      >
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 40);
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {d.value > 0
                  ? formatValue
                    ? formatValue(d.value)
                    : shortNumFa(d.value)
                  : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: 32,
                  height: Math.max(h, 2),
                  background: color,
                  borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                  transition: noAnim ? 'none' : 'height var(--dur-base)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 4px 0',
          borderTop: '1px solid var(--border)',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DualBarChart
// ═══════════════════════════════════════════════════════
interface DualBarProps {
  data: { label: string; a: number; b: number }[];
  colorA?: string;
  colorB?: string;
  labelA?: string;
  labelB?: string;
  height?: number;
  ariaLabel?: string;
}

export function DualBarChart({
  data,
  colorA = 'var(--accent)',
  colorB = 'var(--danger)',
  labelA = 'درآمد',
  labelB = 'هزینه',
  height = 160,
  ariaLabel,
}: DualBarProps) {
  const noAnim = useNoAnim();
  const max = Math.max(...data.flatMap(d => [d.a, d.b]), 1);
  const label = ariaLabel || `نمودار دو ستونی — ${data.length} گروه، ${labelA} در برابر ${labelB}`;

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: '100%', padding: '12px 0' }}
    >
      <div
        style={{
          display: 'flex',
          gap: 16,
          justifyContent: 'center',
          marginBottom: 8,
          fontSize: 'var(--fs-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            aria-hidden="true"
            style={{ width: 12, height: 12, background: colorA, borderRadius: 'var(--r-sm)' }}
          />
          <span style={{ color: 'var(--muted)' }}>{labelA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            aria-hidden="true"
            style={{ width: 12, height: 12, background: colorB, borderRadius: 'var(--r-sm)' }}
          />
          <span style={{ color: 'var(--muted)' }}>{labelB}</span>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height,
          padding: '0 4px',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              gap: 2,
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                flex: 1,
                maxWidth: 18,
                height: Math.max((d.a / max) * (height - 20), 2),
                background: colorA,
                borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                transition: noAnim ? 'none' : 'height var(--dur-base)',
              }}
            />
            <div
              style={{
                flex: 1,
                maxWidth: 18,
                height: Math.max((d.b / max) * (height - 20), 2),
                background: colorB,
                borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                transition: noAnim ? 'none' : 'height var(--dur-base)',
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '6px 4px 0',
          borderTop: '1px solid var(--border)',
        }}
      >
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// LineChart
// ═══════════════════════════════════════════════════════
interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
  ariaLabel?: string;
}

export function LineChart({
  data,
  color = 'var(--accent)',
  height = 140,
  ariaLabel,
}: LineChartProps) {
  const noAnim = useNoAnim();

  if (data.length < 2) {
    return (
      <div
        role="status"
        style={{
          padding: 40,
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--muted)',
        }}
      >
        برای نمایش نمودار، حداقل ۲ نقطه داده لازم است
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;
  const w = 100;
  const h = 60;
  const total = data.reduce((a, d) => a + d.value, 0);
  const label = ariaLabel || `نمودار خطی — ${data.length} نقطه، مجموع ${shortNumFa(total)}`;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.value - min) / range) * h;
    return { x, y };
  });

  const pathD = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
  const areaD = pathD + ' L' + w + ',' + h + ' L0,' + h + ' Z';

  // شناسه یکتا برای gradient (چند LineChart تو یه صفحه)
  const gradId = 'pmLineGrad-' + Math.random().toString(36).slice(2, 9);

  return (
    <div
      role="img"
      aria-label={label}
      style={{ width: '100%', padding: '12px 0' }}
    >
      <svg
        viewBox={'0 0 ' + w + ' ' + h}
        preserveAspectRatio="none"
        style={{ width: '100%', height, display: 'block' }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#${gradId})`} />
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 4, padding: '6px 4px 0' }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// PieChart
// ═══════════════════════════════════════════════════════
interface PieProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  ariaLabel?: string;
}

export function PieChart({ data, size = 140, ariaLabel }: PieProps) {
  const total = data.reduce((a, d) => a + d.value, 0);

  if (total === 0) {
    return (
      <div
        role="status"
        style={{
          padding: 30,
          textAlign: 'center',
          fontSize: 'var(--fs-sm)',
          color: 'var(--muted)',
        }}
      >
        داده‌ای برای نمایش نیست
      </div>
    );
  }

  const label =
    ariaLabel ||
    `نمودار دایره‌ای — ${data.filter(d => d.value > 0).length} بخش، مجموع ${shortNumFa(total)}`;

  let acc = 0;
  const radius = 50;
  const cx = 60;
  const cy = 60;
  const arcs = data.map(d => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += d.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    const pathD =
      'M' + cx + ',' + cy + ' L' + x1 + ',' + y1 +
      ' A' + radius + ',' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ',' + y2 + ' Z';
    return { pathD, color: d.color };
  });

  return (
    <div
      role="img"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}
    >
      <svg viewBox="0 0 120 120" style={{ width: size, height: size }}>
        {arcs.map((a, i) => (
          <path key={i} d={a.pathD} fill={a.color} />
        ))}
        <circle cx={cx} cy={cy} r="28" fill="var(--card-solid)" />
      </svg>
      <div
        role="list"
        style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        {data
          .filter(d => d.value > 0)
          .map((d, i) => (
            <div
              key={i}
              role="listitem"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 'var(--fs-xs)',
              }}
            >
              <div
                aria-hidden="true"
                style={{ width: 12, height: 12, background: d.color, borderRadius: 'var(--r-sm)' }}
              />
              <span style={{ color: 'var(--text)' }}>{d.label}</span>
              <span style={{ color: 'var(--muted)' }}>
                ({toFaNum(Math.round((d.value / total) * 100))}٪)
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════
export function shortNumFa(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return toFaNum((n / 1_000_000_000).toFixed(1)) + 'B';
  if (abs >= 1_000_000) return toFaNum((n / 1_000_000).toFixed(1)) + 'M';
  if (abs >= 1_000) return toFaNum((n / 1_000).toFixed(0)) + 'k';
  return toFaNum(String(Math.round(n)));
}

function toFaNum(s: string | number): string {
  return String(s).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
}
