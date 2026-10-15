import type { ReactNode, CSSProperties } from 'react';
import { Input } from '../components/ui';
import { RowItem } from './RowItem';
import type { FilterDef } from './types';

function chipIn(active: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    height: 32, padding: '0 10px',
    background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-md)',
    color: active ? 'var(--accent)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
    fontWeight: active ? 700 : 600, cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--dur-fast) var(--ease-out)',
  };
}

export function FilterGroupBody<T>({ def, value, setFilter, clearFilter }: {
  def: FilterDef<T>;
  value: any;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
}): ReactNode {
  const v = value;

    if (def.kind === 'enum') {
      const isMulti = !!def.multi;
      const layout = def.layout || 'grid';

      // ─── حالت grid دوستونه ───
      if (layout === 'grid') {
        const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
        const noneActive = isMulti ? arr.length === 0 : !v;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
            <button type="button"
              onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: 40, padding: '6px 8px',
                background: noneActive ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                border: '1px solid ' + (noneActive ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 12,
                color: noneActive ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
                fontWeight: noneActive ? 700 : 600, cursor: 'pointer',
                textAlign: 'center',
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}>
              همه
            </button>
            {def.options?.map(o => {
              const active = isMulti ? arr.includes(o.value) : v === o.value;
              return (
                <button key={o.value} type="button"
                  onClick={() => {
                    if (isMulti) {
                      const next = active ? arr.filter(x => x !== o.value) : [...arr, o.value];
                      setFilter(def.key, next);
                    } else {
                      setFilter(def.key, active ? '' : o.value);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                    minHeight: 40, padding: '6px 8px',
                    background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 12,
                    color: active ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
                    fontWeight: active ? 700 : 600, cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}>
                  {o.icon && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: typeof o.icon === 'string' ? 'var(--fs-md)' : undefined,
                    }}>{o.icon}</span>
                  )}
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{o.label}</span>
                </button>
              );
            })}
          </div>
        );
      }

      if (layout === 'rows') {
        const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
        const noneActive = isMulti ? arr.length === 0 : !v;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <RowItem
              active={noneActive}
              multi={isMulti}
              label="همه"
              onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
            />
            {def.options?.map(o => {
              const active = isMulti ? arr.includes(o.value) : v === o.value;
              return (
                <RowItem
                  key={o.value}
                  active={active}
                  multi={isMulti}
                  icon={o.icon}
                  label={o.label}
                  onClick={() => {
                    if (isMulti) {
                      const next = active ? arr.filter(x => x !== o.value) : [...arr, o.value];
                      setFilter(def.key, next);
                    } else {
                      setFilter(def.key, active ? '' : o.value);
                    }
                  }}
                />
              );
            })}
          </div>
        );
      }

      const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
      const noneActive = isMulti ? arr.length === 0 : !v;
      return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button type="button"
            onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
            style={chipIn(noneActive)}>همه</button>
          {def.options?.map(o => {
            const active = isMulti ? arr.includes(o.value) : v === o.value;
            return (
              <button key={o.value} type="button"
                onClick={() => {
                  if (isMulti) {
                    const next = active ? arr.filter(x => x !== o.value) : [...arr, o.value];
                    setFilter(def.key, next);
                  } else {
                    setFilter(def.key, active ? '' : o.value);
                  }
                }}
                style={chipIn(active)}>
                {o.icon && <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: typeof o.icon === 'string' ? 'var(--fs-base)' : undefined,
                }}>{o.icon}</span>}
                <span>{o.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    if (def.kind === 'boolean') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <RowItem active={v === undefined || v === null} multi={false}
            label="همه" onClick={() => clearFilter(def.key)} />
          <RowItem active={v === true} multi={false}
            label="بله" onClick={() => setFilter(def.key, true)} />
          <RowItem active={v === false} multi={false}
            label="خیر" onClick={() => setFilter(def.key, false)} />
        </div>
      );
    }

    if (def.kind === 'dateRange') {
      const [a, b] = (v as [string, string]) || ['', ''];
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input placeholder="از" value={a || ''}
            onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>—</span>
          <Input placeholder="تا" value={b || ''}
            onChange={e => setFilter(def.key, [a || '', e.target.value])} />
        </div>
      );
    }

    if (def.kind === 'numberRange') {
      const [a, b] = (v as [number, number]) || [null, null];
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input type="number" placeholder="از" value={a ?? ''}
            onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>—</span>
          <Input type="number" placeholder="تا" value={b ?? ''}
            onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
        </div>
      );
    }

    return null;
  }
