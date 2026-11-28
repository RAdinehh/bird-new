import type { ReactNode, CSSProperties } from 'react';
import { Input } from '../components/ui';
import DatePicker from '../components/DatePicker';
import { RowItem } from './RowItem';
import type { FilterDef, FilterState } from './types';
import { parseFaNum } from '../utils/fa';

function chipIn(active: boolean): CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 38, minHeight: 38, padding: '0 12px',
    boxSizing: 'border-box',
    background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-md)',
    boxShadow: 'none', opacity: 1,
    color: active ? 'var(--accent)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
    fontWeight: 600, cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--dur-fast) var(--ease-out)',
  };
}

export function FilterGroupBody<T>({ def, value, setFilter, clearFilter, filterState }: {
  def: FilterDef<T>;
  value: string | string[] | [string, string] | [number, number] | boolean | null | undefined;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  filterState: FilterState;
}): ReactNode {
  const v = value;
  const displayOptions = def.dynamicOptions ? def.dynamicOptions(filterState) : (def.options || []);

    if (def.kind === 'enum') {
      const isMulti = !!def.multi;
      const layout = def.layout || 'grid';

      // ─── حالت grid دوستونه ───
      if (layout === 'grid') {
        const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
        const noneActive = isMulti ? arr.length === 0 : !v;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <button type="button"
              onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 38, minHeight: 38, padding: '0 8px', boxSizing: 'border-box', boxShadow: 'none', opacity: 1,
                background: noneActive ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                border: '1px solid ' + (noneActive ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                color: noneActive ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
                fontWeight: 600, cursor: 'pointer',
                textAlign: 'center',
                transition: 'all var(--dur-fast) var(--ease-out)',
              }}>
              همه
            </button>
            {displayOptions.map(o => {
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
                    height: 38, minHeight: 38, padding: '0 8px', boxSizing: 'border-box', boxShadow: 'none', opacity: 1,
                    background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 'var(--r-md)',
                    color: active ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
                    fontWeight: 600, cursor: 'pointer',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}>
                  {o.icon && typeof o.icon !== 'string' && (
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
            {displayOptions.map(o => {
              const active = isMulti ? arr.includes(o.value) : v === o.value;
              return (
                <RowItem
                  key={o.value}
                  active={active}
                  multi={isMulti}
                  icon={typeof o.icon === 'string' ? undefined : o.icon}
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
          {displayOptions.map(o => {
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
                {o.icon && typeof o.icon !== 'string' && <span style={{
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 6, alignItems: 'center', width: '100%' }}>
          <DatePicker
            value={a || ''}
            placeholder="از تاریخ"
            onChange={v2 => {
              const nextEnd = b && v2 && v2 > b ? v2 : (b || '');
              setFilter(def.key, [v2, nextEnd]);
            }}
          />
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>—</span>
          <DatePicker
            value={b || ''}
            placeholder="تا تاریخ"
            onChange={v2 => {
              const nextStart = a && v2 && v2 < a ? v2 : (a || '');
              setFilter(def.key, [nextStart, v2]);
            }}
          />
        </div>
      );
    }

    if (def.kind === 'numberRange') {
      const [a, b] = (v as [number, number]) || [null, null];
      return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Input inputMode="numeric" placeholder="از" value={a ?? ''}
            onChange={e => setFilter(def.key, [e.target.value ? parseFaNum(e.target.value) : null, b ?? null])} />
          <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>—</span>
          <Input inputMode="numeric" placeholder="تا" value={b ?? ''}
            onChange={e => setFilter(def.key, [a ?? null, e.target.value ? parseFaNum(e.target.value) : null])} />
        </div>
      );
    }

    return null;
  }
