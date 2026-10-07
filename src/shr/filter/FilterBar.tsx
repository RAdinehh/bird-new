/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * طراحی: Tabs بین گروه‌ها + ردیف‌های بلند + بدون گرادیانت
 */
import { useState, type ReactNode } from 'react';
import { Sheet, Input, Btn } from '../components/ui';
import {
  IconFilter, IconSort, IconX, IconArrowUp, IconArrowDown, IconCheck,
} from '../icons';
import type { FilterDef, SortDef, FilterState, SortState } from './types';

interface Props<T> {
  filterDefs: FilterDef<T>[];
  sortDefs: SortDef<T>[];
  filterState: FilterState;
  sortState: SortState | null;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  setSort: (s: SortState | null) => void;
  toggleSort: (key: string) => void;
  resetAll: () => void;
  hasActiveFilters: boolean;
  total: number;
  count: number;
}

function summarizeChip<T>(def: FilterDef<T>, v: any): { text: string; icon?: ReactNode } | null {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v) && (v.length === 0 || v.every((x: any) => x === ''))) return null;
  if (def.kind === 'enum') {
    const arr = Array.isArray(v) ? (v as string[]) : [String(v)];
    const opts = arr.map(x => def.options?.find(o => o.value === x));
    const labels = opts.map((o, i) => o?.label || arr[i]);
    const icon = opts[0]?.icon;
    if (labels.length === 1) return { text: labels[0], icon };
    return { text: `${labels.length} مورد`, icon };
  }
  if (def.kind === 'dateRange') {
    const [a, b] = v as [string, string];
    return { text: `${a || '?'}–${b || '?'}` };
  }
  if (def.kind === 'numberRange') {
    const [a, b] = v as [number, number];
    return { text: `${a ?? '?'}–${b ?? '?'}` };
  }
  if (def.kind === 'boolean') return { text: v ? 'بله' : 'خیر' };
  return { text: String(v) };
}

function isEmptyVal(v: any): boolean {
  if (v === undefined || v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0 || v.every((x: any) => x === '');
  return false;
}

export function FilterBar<T>({
  filterDefs, sortDefs, filterState, sortState,
  setFilter, clearFilter, setSort: _setSort, toggleSort, resetAll,
  hasActiveFilters: _hasActiveFilters, total, count,
}: Props<T>) {
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);


  const activeCount = Object.keys(filterState).filter(k => !isEmptyVal(filterState[k])).length;

  const chips = filterDefs
    .map(def => {
      const v = filterState[def.key];
      const sum = summarizeChip(def, v);
      if (!sum) return null;
      return { key: def.key, label: def.label, ...sum };
    })
    .filter(Boolean) as Array<{ key: string; label: string; text: string; icon?: ReactNode }>;

  const sortLabel = sortState
    ? (sortDefs.find(s => s.key === sortState.key)?.label || '')
    : null;

  const countActiveInGroup = (def: FilterDef<T>): number => {
    const v = filterState[def.key];
    if (isEmptyVal(v)) return 0;
    if (def.kind === 'enum') {
      if (Array.isArray(v)) return (v as string[]).filter(x => x !== '').length;
      return 1;
    }
    if (def.kind === 'dateRange' || def.kind === 'numberRange') {
      const [a, b] = v as any[];
      return (a != null && a !== '') || (b != null && b !== '') ? 1 : 0;
    }
    if (def.kind === 'boolean') return 1;
    return 0;
  };

  const topBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 'var(--sp-1)',
    height: 32, padding: '0 var(--sp-3)',
    background: active ? 'var(--accent)' : 'var(--card)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--avatar-text)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'all var(--dur-fast) var(--ease-out)',
  });

  const RowItem = ({
    active, multi, icon, label, count: cnt, onClick,
  }: {
    active: boolean; multi: boolean;
    icon?: ReactNode; label: string; count?: number;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 10px', minHeight: 42, width: '100%',
      background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
      border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
      borderRadius: 'var(--r-lg)',
      cursor: 'pointer', fontFamily: 'inherit',
      textAlign: 'right',
      transition: 'all var(--dur-fast) var(--ease-out)',
    }}>
      {icon && (
        <span style={{
          width: 26, height: 26, borderRadius: 'var(--r-sm)',
          background: active ? 'var(--accent)' : 'var(--input-bg)',
          color: active ? 'var(--avatar-text)' : 'var(--muted)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--dur-fast) var(--ease-out)',
        }}>{icon}</span>
      )}
      <span style={{
        flex: 1, fontSize: 'var(--fs-base)',
        fontWeight: active ? 700 : 600,
        color: active ? 'var(--accent)' : 'var(--text)',
      }}>{label}</span>
      {cnt !== undefined && (
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: active ? 'var(--accent)' : 'var(--muted)',
          background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
          border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
          padding: '2px 8px', borderRadius: 8,
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>{cnt}</span>
      )}
      <span style={{
        width: 22, height: 22, flexShrink: 0,
        borderRadius: multi ? 6 : 11,
        background: active ? 'var(--accent)' : 'var(--input-bg)',
        border: '2px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff',
        transition: 'all var(--dur-fast) var(--ease-out)',
      }}>
        {active && (multi
          ? <IconCheck size={12} />
          : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
        )}
      </span>
    </button>
  );

  const chipIn = (active: boolean): React.CSSProperties => ({
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
  });

  const renderGroupBody = (def: FilterDef<T>) => {
    const v = filterState[def.key];

    if (def.kind === 'enum') {
      const isMulti = !!def.multi;
      const layout = def.layout || 'grid';

      // ─── حالت grid دوستونه ───
      if (layout === 'grid') {
        const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
        const noneActive = isMulti ? arr.length === 0 : !v;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <button type="button"
              onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                minHeight: 34, padding: '5px 8px',
                background: noneActive ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                border: '1px solid ' + (noneActive ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                color: noneActive ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    minHeight: 34, padding: '5px 8px',
                    background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 'var(--r-md)',
                    color: active ? 'var(--accent)' : 'var(--text)',
                    fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
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
                      fontSize: typeof o.icon === 'string' ? 15 : undefined,
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
                  fontSize: typeof o.icon === 'string' ? 14 : undefined,
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
  };

  return (
    <>
      <div style={{
        display: 'flex', gap: 'var(--sp-2)',
        padding: 'var(--sp-2) var(--sp-3)',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button type="button" onClick={() => setOpenFilters(true)}
          aria-label="فیلترها" style={topBtn(activeCount > 0)}>
          <IconFilter size={13} />
          <span>فیلتر</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 16, height: 16, padding: '0 4px',
              background: 'rgba(255,255,255,0.28)',
              borderRadius: 8, fontSize: 10, fontWeight: 800,
              marginRight: -2,
            }}>{activeCount}</span>
          )}
        </button>

        {sortDefs.length > 0 && (
          <button type="button" onClick={() => setOpenSort(true)}
            aria-label="مرتب‌سازی" style={topBtn(!!sortState)}>
            <IconSort size={13} />
            <span>{sortLabel || 'مرتب'}</span>
            {sortState && (
              <span style={{ display: 'inline-flex', marginRight: -2 }}>
                {sortState.dir === 'asc' ? <IconArrowUp size={11} /> : <IconArrowDown size={11} />}
              </span>
            )}
          </button>
        )}

        <div style={{
          marginRight: 'auto', display: 'flex', alignItems: 'center',
          gap: 'var(--sp-2)', paddingLeft: 'var(--sp-1)',
        }}>
          <span style={{
            fontSize: 'var(--fs-xs)', color: 'var(--muted)',
            fontWeight: 700, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {count === total ? `${total} مورد` : `${count} از ${total}`}
          </span>
        </div>
      </div>

      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px var(--sp-3)',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 4px 4px 10px', height: 28,
              maxWidth: 220,
              background: 'var(--card)',
              border: '1px solid var(--accent)',
              borderRadius: 999,
              color: 'var(--accent)', fontSize: 11.5, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{
                opacity: 0.65, fontWeight: 600, fontSize: 10.5,
                overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 70,
              }}>{c.label}</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 110,
              }}>{c.text}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, flexShrink: 0, marginRight: 2,
                  background: 'var(--accent)', color: 'var(--avatar-text)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0, lineHeight: 1,
                }}><IconX size={10} /></button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filterDefs.map((def, idx) => {
            const cnt = countActiveInGroup(def);
            return (
              <div key={def.key} style={{
                paddingTop: idx === 0 ? 0 : 10,
                paddingBottom: 6,
                borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                marginTop: idx === 0 ? 0 : 4,
              }}>
                {/* تیتر گروه */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  marginBottom: 8,
                }}>
                  {def.icon && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, flexShrink: 0,
                      background: cnt > 0 ? 'var(--accent-soft)' : 'transparent',
                      color: cnt > 0 ? 'var(--accent)' : 'var(--muted)',
                      borderRadius: 'var(--r-sm)',
                      fontSize: typeof def.icon === 'string' ? 14 : undefined,
                    }}>{def.icon}</span>
                  )}
                  <span style={{
                    fontSize: 'var(--fs-xs)', fontWeight: 700,
                    color: 'var(--text)', lineHeight: 1.2,
                  }}>{def.label}</span>
                  {cnt > 0 && (
                    <span style={{
                      fontSize: 10, color: 'var(--accent)',
                      fontWeight: 700,
                      background: 'var(--accent-soft)',
                      padding: '1px 6px', borderRadius: 6,
                    }}>{cnt}</span>
                  )}
                  <div style={{ flex: 1 }} />
                  {cnt > 0 && (
                    <button type="button" onClick={() => clearFilter(def.key)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--muted)', fontFamily: 'inherit',
                        fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', padding: '2px 6px',
                      }}>پاک</button>
                  )}
                </div>
                {/* بدنه */}
                {renderGroupBody(def)}
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex', gap: 'var(--sp-2)',
          paddingTop: 'var(--sp-4)',
          borderTop: '1px solid var(--border)',
          marginTop: 'var(--sp-4)',
        }}>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={14} /> تأیید
            </span>
          </Btn>
          <button type="button" onClick={resetAll} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, height: 40, padding: '0 14px',
            background: 'var(--danger-soft)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--r-md)',
            color: 'var(--danger)', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer',
            flexShrink: 0,
          }}>پاک‌سازی</button>
        </div>
      </Sheet>

      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortDefs.map(def => {
            const active = sortState?.key === def.key;
            const dir = sortState?.dir || 'asc';
            return (
              <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  width: '100%', padding: '8px 10px', minHeight: 42,
                  background: active ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                  border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                  borderRadius: 'var(--r-lg)',
                  color: 'var(--text)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                {def.icon && (
                  <span style={{
                    width: 30, height: 30, borderRadius: 'var(--r-sm)',
                    background: active ? 'var(--accent)' : 'var(--input-bg)',
                    color: active ? 'var(--avatar-text)' : 'var(--muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{def.icon}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-base)', fontWeight: 700,
                    color: active ? 'var(--accent)' : 'var(--text)',
                    lineHeight: 1.2,
                  }}>{def.label}</div>
                  <div style={{
                    fontSize: 10.5, color: 'var(--muted)',
                    marginTop: 2, fontWeight: 500,
                  }}>
                    {active
                      ? (dir === 'asc' ? 'صعودی — از کوچک به بزرگ' : 'نزولی — از بزرگ به کوچک')
                      : (def.hint || 'برای مرتب‌سازی لمس کن')}
                  </div>
                </div>
                {active && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 24, height: 24, flexShrink: 0,
                    background: 'var(--accent)',
                    color: 'var(--avatar-text)',
                    borderRadius: '50%',
                    lineHeight: 1,
                  }}>
                    {dir === 'asc' ? <IconArrowUp size={12} /> : <IconArrowDown size={12} />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
