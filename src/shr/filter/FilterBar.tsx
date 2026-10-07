/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی (Compact)
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
    // اگه چندتایی: فقط تعداد + آیکون
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

export function FilterBar<T>({
  filterDefs, sortDefs, filterState, sortState,
  setFilter, clearFilter, setSort: _setSort, toggleSort, resetAll,
  hasActiveFilters, total, count,
}: Props<T>) {
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const activeCount = Object.keys(filterState).filter(k => {
    const v = filterState[k];
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0 && v.some((x: any) => x !== '');
    return true;
  }).length;

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

  // ─── چیپ داخل Sheet — ۳۰px ───
  const chipIn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    height: 30, padding: '0 var(--sp-3)',
    background: active ? 'var(--accent)' : 'var(--input-bg)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 999,
    color: active ? 'var(--avatar-text)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-xs)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all var(--dur-fast) var(--ease-out)',
  });

  // ─── Header ساده گروه — بدون کارت ───
  const groupHeader = (label: string, activeNow: number, activeText: string, clearKey: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
      marginBottom: 'var(--sp-2)',
    }}>
      <span style={{
        fontSize: 'var(--fs-xs)', fontWeight: 800, color: 'var(--text)',
        letterSpacing: 0.2,
      }}>{label}</span>
      <span style={{
        fontSize: 'var(--fs-xs)', fontWeight: 500, color: 'var(--muted)',
        flex: 1,
      }}>· {activeText}</span>
      {activeNow > 0 && (
        <button type="button" onClick={() => clearFilter(clearKey)}
          style={{
            background: 'none', border: 'none',
            color: 'var(--muted)', fontFamily: 'inherit',
            fontSize: 'var(--fs-xs)', fontWeight: 700,
            cursor: 'pointer', padding: '2px 4px',
          }}>پاک</button>
      )}
    </div>
  );

  return (
    <>
      {/* ═══ نوار بالا — ۳۲px ═══ */}
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
          {hasActiveFilters && (
            <button type="button" onClick={resetAll} aria-label="پاک‌سازی"
              style={{
                background: 'none', border: 'none', padding: '4px 6px',
                color: 'var(--muted)', fontFamily: 'inherit',
                fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>پاک همه</button>
          )}
          <span style={{
            fontSize: 'var(--fs-xs)', color: 'var(--muted)',
            fontWeight: 700, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {count === total ? `${total} مورد` : `${count} از ${total}`}
          </span>
        </div>
      </div>

      {/* ═══ چیپ‌های فیلتر فعال ═══ */}
      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px var(--sp-3)',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 4px 3px 8px', height: 24,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 999,
              color: 'var(--accent)', fontSize: 11, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {c.icon && <span style={{ fontSize: 12, lineHeight: 1, display: 'inline-flex' }}>{c.icon}</span>}
              <span>{c.text}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16,
                  background: 'var(--accent)', color: 'var(--avatar-text)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0, lineHeight: 1,
                }}><IconX size={9} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sheet فیلترها — Compact ═══ */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filterDefs.map((def, idx) => {
            const v = filterState[def.key];
            const wrap = (children: ReactNode) => (
              <div key={def.key} style={{
                paddingTop: idx === 0 ? 0 : 'var(--sp-4)',
                paddingBottom: 'var(--sp-4)',
                borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
              }}>{children}</div>
            );

            // ═══ enum ═══
            if (def.kind === 'enum') {
              const isMulti = !!def.multi;
              const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
              const noneActive = isMulti ? arr.length === 0 : !v;
              const activeNow = isMulti ? arr.length : (v ? 1 : 0);
              const activeText = activeNow > 0 ? `${activeNow} مورد انتخاب` : 'همه';
              return wrap(
                <div>
                  {groupHeader(def.label, activeNow, activeText, def.key)}
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
                          {o.icon && <span style={{ fontSize: 12, lineHeight: 1, display: 'inline-flex' }}>{o.icon}</span>}
                          <span>{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ═══ boolean ═══
            if (def.kind === 'boolean') {
              const activeNow = v === true || v === false;
              const activeText = activeNow ? (v ? 'فقط بله' : 'فقط خیر') : 'همه';
              return wrap(
                <div>
                  {groupHeader(def.label, activeNow ? 1 : 0, activeText, def.key)}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" onClick={() => clearFilter(def.key)}
                      style={chipIn(v === undefined || v === null)}>همه</button>
                    <button type="button" onClick={() => setFilter(def.key, true)}
                      style={chipIn(v === true)}>بله</button>
                    <button type="button" onClick={() => setFilter(def.key, false)}
                      style={chipIn(v === false)}>خیر</button>
                  </div>
                </div>
              );
            }

            // ═══ dateRange ═══
            if (def.kind === 'dateRange') {
              const [a, b] = (v as [string, string]) || ['', ''];
              const activeNow = !!(a || b);
              const activeText = activeNow ? `${a || '?'} تا ${b || '?'}` : 'همه';
              return wrap(
                <div>
                  {groupHeader(def.label, activeNow ? 1 : 0, activeText, def.key)}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Input placeholder="از" value={a || ''}
                      onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>—</span>
                    <Input placeholder="تا" value={b || ''}
                      onChange={e => setFilter(def.key, [a || '', e.target.value])} />
                  </div>
                </div>
              );
            }

            // ═══ numberRange ═══
            if (def.kind === 'numberRange') {
              const [a, b] = (v as [number, number]) || [null, null];
              const activeNow = a != null || b != null;
              const activeText = activeNow ? `${a ?? '?'} تا ${b ?? '?'}` : 'همه';
              return wrap(
                <div>
                  {groupHeader(def.label, activeNow ? 1 : 0, activeText, def.key)}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Input type="number" placeholder="از" value={a ?? ''}
                      onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0 }}>—</span>
                    <Input type="number" placeholder="تا" value={b ?? ''}
                      onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div style={{
          display: 'flex', gap: 'var(--sp-2)',
          paddingTop: 'var(--sp-4)',
          borderTop: '1px solid var(--border)',
          marginTop: 'var(--sp-2)',
        }}>
          <button type="button" onClick={resetAll} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, height: 44, padding: '0 16px',
            background: 'var(--danger-soft)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--r-md)',
            color: 'var(--danger)', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer',
            flex: 1,
          }}>پاک‌سازی همه</button>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={14} /> تأیید
            </span>
          </Btn>
        </div>
      </Sheet>

      {/* ═══ Sheet مرتب‌سازی — Compact ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortDefs.map(def => {
            const active = sortState?.key === def.key;
            const dir = sortState?.dir || 'asc';
            return (
              <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  width: '100%', padding: '10px 12px', minHeight: 44,
                  background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-sm)', fontWeight: 700,
                    color: active ? 'var(--accent)' : 'var(--text)',
                    lineHeight: 1.2,
                  }}>{def.label}</div>
                  <div style={{
                    fontSize: 10.5, color: 'var(--muted)',
                    marginTop: 2, fontWeight: 500,
                  }}>
                    {active
                      ? (dir === 'asc' ? 'صعودی' : 'نزولی')
                      : (def.hint || 'لمس کن')}
                  </div>
                </div>
                {active && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, flexShrink: 0,
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
