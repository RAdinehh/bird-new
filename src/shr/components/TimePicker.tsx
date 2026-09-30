import { useState, useEffect, useRef } from 'react';
import { Btn, Modal } from './ui';
import { toFa, toEn } from '../utils/fa';
import { useSet } from '../../mod/set/store';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
}

const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_INNER = 72;
const R_OUTER = 112;
const R_MID = (R_INNER + R_OUTER) / 2;
const R_MIN = 100;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.sin(rad), y: CY - radius * Math.cos(rad) };
}

function parseTime(v: string) {
  const parts = (v || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).split(':');
  const h = parseInt(parts[0]) || 0;
  const m = parseInt(parts[1]) || 0;
  return { h: Math.min(23, Math.max(0, h)), m: Math.min(59, Math.max(0, m)) };
}

export default function TimePicker({
  value, onChange,
  placeholder = 'انتخاب ساعت',
  disabled = false, required = false,
  error, warn, compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [step, setStep] = useState<'hour' | 'minute'>('hour');
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hourRef = useRef(0);
  const minuteRef = useRef(0);

  useEffect(() => { hourRef.current = hour; }, [hour]);
  useEffect(() => { minuteRef.current = minute; }, [minute]);

  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch { /* silent */ }
  }, []);
  const noAnim = !!(lowPower || prefersReduced);

  const openPicker = () => {
    if (disabled) return;
    const p = parseTime(value);
    setHour(p.h);
    setMinute(p.m);
    setStep('hour');
    setOpen(true);
  };

  const commitNow = (h: number, m: number) => {
    onChange(String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    setOpen(false);
  };

  const setNow = () => {
    const now = new Date();
    setHour(now.getHours());
    setMinute(now.getMinutes());
    setStep('hour');
  };

  const pointerToTime = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scaleX = SIZE / rect.width;
    const scaleY = SIZE / rect.height;
    const px = (clientX - rect.left) * scaleX - CX;
    const py = (clientY - rect.top) * scaleY - CY;
    const dist = Math.sqrt(px * px + py * py);
    let angle = Math.atan2(px, -py) * 180 / Math.PI;
    if (angle < 0) angle += 360;
    return { angle, dist };
  };

  const applyPointer = (clientX: number, clientY: number) => {
    const r = pointerToTime(clientX, clientY);
    if (!r) return;
    if (step === 'hour') {
      let h: number;
      if (r.dist < R_MID) h = Math.round(r.angle / 30) % 12;
      else h = 12 + Math.round(r.angle / 30) % 12;
      setHour(h);
    } else {
      const m = Math.round(r.angle / 6) % 60;
      setMinute(m);
    }
  };

  const handleDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    try { (e.currentTarget as any).setPointerCapture(e.pointerId); } catch { /* silent */ }
    setDragging(true);
    applyPointer(e.clientX, e.clientY);
  };

  const handleMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    e.preventDefault();
    applyPointer(e.clientX, e.clientY);
  };

  const handleUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return;
    setDragging(false);
    if (step === 'hour') {
      // برو به دقیقه
      setTimeout(() => setStep('minute'), 150);
    } else {
      // تمام — با مقادیر به‌روز commit کن
      setTimeout(() => commitNow(hourRef.current, minuteRef.current), 150);
    }
  };

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = compact ? 32 : 38;
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';

  // موقعیت دسته بر اساس مرحله
  const handPos = (() => {
    if (step === 'hour') {
      const angle = (hour % 12) * 30;
      const radius = hour < 12 ? R_INNER : R_OUTER;
      return polar(angle, radius);
    }
    const idx = Math.round(minute / 5) % 12;
    return polar(idx * 30, R_MIN);
  })();

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-label={required ? placeholder + ' (اجباری)' : placeholder}
        aria-invalid={!!error}
        style={{
          width: '100%', height,
          background: 'var(--input-bg)',
          border: '1px solid ' + borderColor,
          borderRadius: 'var(--r-md)',
          padding: compact ? '0 10px' : '0 12px',
          color: value ? 'var(--text)' : 'var(--dim)',
          fontFamily: 'inherit', fontSize,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          textAlign: 'right',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          minWidth: 0, outline: 'none',
        }}
        onFocus={(e) => { if (!disabled) e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? toFa(value) : placeholder}
          {required && !value ? <span style={{ color: 'var(--danger)', marginRight: 4 }}> *</span> : null}
        </span>
        <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: 'var(--dim)' }} aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </button>

      {(error || warn) && (
        <div style={{ fontSize: 'var(--fs-xs)', color: error ? 'var(--danger)' : 'var(--warn)', marginTop: 4 }}>
          {error ? '✕ ' + error : '⚠ ' + warn}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={step === 'hour' ? 'انتخاب ساعت' : 'انتخاب دقیقه'}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: 8 }}>
            {step === 'minute' && (
              <Btn onClick={() => setStep('hour')} style={{ flex: 1 }}>‹ ساعت</Btn>
            )}
            <Btn onClick={setNow} style={{ flex: 1 }}>🕐 الان</Btn>
            <Btn onClick={() => { onChange(''); setOpen(false); }} style={{ flex: 1 }}>پاک</Btn>
          </div>
        }
      >
        {/* ═══ نمایش دیجیتال ═══ */}
        <div aria-live="polite" aria-atomic="true" style={{ textAlign: 'center', padding: '4px 0 8px' }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)', fontVariantNumeric: 'tabular-nums', letterSpacing: 3, direction: 'ltr' }}>
            {toFa(String(hour).padStart(2, '0'))}:{toFa(String(minute).padStart(2, '0'))}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {step === 'hour' ? '🕐 ساعت را انتخاب کن' : '⏱ دقیقه را انتخاب کن'}
          </div>
        </div>

        {/* ═══ ساعت عقربه‌ای ═══ */}
        <svg
          ref={svgRef}
          viewBox={'0 0 ' + SIZE + ' ' + SIZE}
          width="100%"
          style={{ maxWidth: SIZE, display: 'block', margin: '0 auto', touchAction: 'none', cursor: 'pointer', userSelect: 'none' }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          <circle cx={CX} cy={CY} r={R_OUTER + 22} fill="var(--input-bg)" opacity="0.4" />

          {/* مرحله ساعت: دو حلقه */}
          {step === 'hour' && (
            <>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const pI = polar(angle, R_INNER);
                const pO = polar(angle, R_OUTER);
                const hI = i;
                const hO = i + 12;
                const aI = hour === hI;
                const aO = hour === hO;
                return (
                  <g key={i}>
                    <circle cx={pI.x} cy={pI.y} r={15} fill={aI ? 'var(--accent)' : 'transparent'} />
                    <text x={pI.x} y={pI.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={aI ? 700 : 500} fill={aI ? '#fff' : 'var(--text)'} style={{ pointerEvents: 'none' }}>{toFa(hI)}</text>
                    <circle cx={pO.x} cy={pO.y} r={15} fill={aO ? 'var(--accent)' : 'transparent'} />
                    <text x={pO.x} y={pO.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={aO ? 700 : 500} fill={aO ? '#fff' : 'var(--text)'} style={{ pointerEvents: 'none' }}>{toFa(hO)}</text>
                  </g>
                );
              })}
            </>
          )}

          {/* مرحله دقیقه: یک حلقه */}
          {step === 'minute' && (
            <>
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = i * 30;
                const m = i * 5;
                const p = polar(angle, R_MIN);
                const active = Math.floor(minute / 5) === i;
                return (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r={15} fill={active ? 'var(--accent)' : 'transparent'} />
                    <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={active ? 700 : 500} fill={active ? '#fff' : 'var(--text)'} style={{ pointerEvents: 'none' }}>{toFa(String(m).padStart(2, '0'))}</text>
                  </g>
                );
              })}
            </>
          )}

          {/* عقربه */}
          <line x1={CX} y1={CY} x2={handPos.x} y2={handPos.y} stroke="var(--accent)" strokeWidth={2.5} strokeLinecap="round" style={{ pointerEvents: 'none' }} />
          <circle cx={CX} cy={CY} r={5} fill="var(--accent)" style={{ pointerEvents: 'none' }} />
          <circle cx={handPos.x} cy={handPos.y} r={12} fill="var(--accent)" opacity={0.25} style={{ pointerEvents: 'none' }} />
        </svg>

        {/* ═══ دکمه تأیید دستی ═══ */}
        <Btn
          variant="primary"
          full
          onClick={() => commitNow(hour, minute)}
          style={{ marginTop: 8 }}
        >
          ✓ تأیید {toFa(String(hour).padStart(2, '0'))}:{toFa(String(minute).padStart(2, '0'))}
        </Btn>
      </Modal>
    </>
  );
}
