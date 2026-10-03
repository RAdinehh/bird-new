/**
 * helpers.tsx — ماژول set
 */
import { useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import { clearLogs, exportLogs, getLogs, logCount, type LogEntry } from '../../cor/logger/logger';
import { showAlert, showConfirmAsync, showSuccess } from '../../cor/store/dialog';
import { showToast } from '../../cor/store/toast';
import { Btn, BtnRow, DigitField, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, PhoneField, Select, Tag } from '../../shr/components/ui';
import { downloadBackup, exportAll, formatSize, getStats, importAll, readFile, type BackupFile, validateBackup } from '../../shr/utils/backup';
import { toEn, toFa } from '../../shr/utils/fa';
import { MODULE_LABELS, useSet } from './store';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', padding: '4px 4px 8px', letterSpacing: '.5px' }}>{title}</div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

export function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
      <span style={{ fontSize: 'var(--fs-base)', color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

export function ToggleRow({ label, sub, value, onChange }: any) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'var(--pad-normal)', background: 'var(--input-bg)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)', gap: 10
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{label}</div>
        {sub ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{sub}</div> : null}
      </div>
      <button
        type="button"
        onClick={onChange}
        role="switch"
        aria-checked={!!value}
        aria-label={label}
        style={{
          width: 40, height: 24, borderRadius: 12,
          background: value ? 'var(--accent)' : 'var(--border)',
          position: 'relative', border: 'none', cursor: 'pointer',
          padding: 0, flexShrink: 0, transition: 'background .2s',
          fontFamily: 'inherit',
        }}
      >
        <span aria-hidden="true" style={{
          position: 'absolute', top: 3,
          right: value ? 19 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          transition: 'right .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.25)',
        }} />
      </button>
    </div>
  );
}

export function ColorBtn({ color, active, onClick }: any) {
  const colors: Record<string, string> = {
    green: '#16a34a', blue: '#0284c7', orange: '#ea580c', purple: '#7c3aed'
  };
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, height: 48,
      borderRadius: 'var(--r-md)',
      background: colors[color],
      border: active ? '3px solid var(--text)' : '3px solid transparent',
      cursor: 'pointer', padding: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: 'var(--fs-xl)', fontWeight: 700
    }}>
      {active ? '✓' : ''}
    </button>
  );
}

export function RowToggle({ label, sub, value, onChange }: { label: string; sub?: string; value: boolean; onChange: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', gap: 10 }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 600 }}>{label}</div>
        {sub ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{sub}</div> : null}
      </div>
      <button onClick={onChange} style={{
        width: 38, height: 36, borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--dim)',
        position: 'relative', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0
      }}>
        <span style={{
          position: 'absolute', top: 2, right: value ? 18 : 2,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'right .2s'
        }} />
      </button>
    </div>
  );
}

export function Line({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

export function LocalNumField({ label, hint, value, onChange, unit, min, max }: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  unit?: string;
  min?: number;
  max?: number;
}) {
  const [local, setLocal] = useState(toFa(String(value ?? 0)));
  const editingRef = useRef(false);

  // فقط وقتی از بیرون تغییر کنه (نه در حال تایپ)
  useEffect(() => {
    if (editingRef.current) return;
    setLocal(toFa(String(value ?? 0)));
  }, [value]);

  const handleChange = (raw: string) => {
    editingRef.current = true;
    setLocal(raw);
    const en = toEn(raw).replace(/[^0-9.-]/g, '');
    // حالت‌های ناقص — صفر بذار ولی local رو دست نزن
    if (en === '' || en === '-' || en === '.' || en === '-.') {
      onChange(0);
      return;
    }
    let n = parseFloat(en);
    if (isNaN(n)) return;
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    onChange(n);
  };

  const handleBlur = () => {
    editingRef.current = false;
    setLocal(toFa(String(value ?? 0)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <label style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--input-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '0 10px', height: 38,
      }}>
        <input
          type="text"
          inputMode="decimal"
          value={local}
          onChange={e => handleChange(e.target.value)}
          onBlur={handleBlur}
          dir="ltr"
          style={{
            flex: 1, border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--text)',
            fontFamily: 'inherit', fontSize: 'var(--fs-base)',
            textAlign: 'left', minWidth: 0,
          }}
        />
        {unit ? (
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexShrink: 0 }}>
            {unit}
          </span>
        ) : null}
      </div>
      {hint ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>{hint}</div>
      ) : null}
    </div>
  );
}

/** SubSection — زیرگروه داخل SettingsGroup */
export function SubSection({ label, icon }: { label: string; icon?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '6px 2px 2px',
      marginTop: 8,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 700,
      color: 'var(--muted)',
      letterSpacing: '.3px',
    }}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </div>
  );
}
