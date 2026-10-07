/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * کارت-محور، SVG آیکون، design tokens
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
    if (labels.length === 2) return { text: labels.join('، '), icon };
    return { text: `${labels[0]} +${labels.length - 1}`, icon };
  }
  if (def.kind === 'dateRange') {
    const [a, b] = v as [string, string];
    return { text: `${a || '?'} تا ${b || '?'}` };
  }
  if (def.kind === 'numberRange') {
    const [a, b] = v as [number, number];
    return { text: `${a ?? '?'}–${b ?? '?'}` };
  }
  if (def.kind === 'boolean') return { text: v ? 'بله' : 'خیر' };
  return { text: String(v) };
}

/** آیکون گروه — اگه ReactNode بود، در ظرف رنگی می‌ذاریم */
function GroupIcon({ icon, active }: { icon?: ReactNode; active: boolean }) {
  if (!icon) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, flexShrink: 0,
      background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
      color: active ? 'var(--accent)' : 'var(--muted)',
      borderRadius: 'var(--r-md)',
      fontSize: 18, lineHeight: 1,
      transition: 'background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out)',
    }}>{icon}</span>
  );
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

  // ─── دکمه‌های نوار بالا ───
  const topBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 'var(--sp-1)',
    height: 36, padding: '0 var(--sp-3)',
    background: active ? 'var(--accent)' : 'var(--card)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 'var(--r-md)',
    color: active ? 'var(--avatar-text)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    boxShadow: active ? 'var(--elev-2)' : 'none',
    transition: 'all var(--dur-fast) var(--ease-out)',
  });

  return (
    <>
      {/* ═══ نوار بالا ═══ */}
      <div style={{
        display: 'flex', gap: 'var(--sp-2)',
        padding: 'var(--sp-2) var(--sp-3)',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button type="button" onClick={() => setOpenFilters(true)}
          aria-label="فیلترها" style={topBtn(activeCount > 0)}>
          <IconFilter size={15} />
          <span>فیلتر</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 5px',
              background: 'rgba(255,255,255,0.28)',
              borderRadius: 9, fontSize: 10.5, fontWeight: 800,
              marginRight: -3,
            }}>{activeCount}</span>
          )}
        </button>

        {sortDefs.length > 0 && (
          <button type="button" onClick={() => setOpenSort(true)}
            aria-label="مرتب‌سازی" style={topBtn(!!sortState)}>
            <IconSort size={15} />
            <span>{sortLabel || 'مرتب'}</span>
            {sortState && (
              <span style={{ display: 'inline-flex', marginRight: -3 }}>
                {sortState.dir === 'asc' ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
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
                background: 'none', border: 'none', padding: '6px 8px',
                color: 'var(--muted)', fontFamily: 'inherit',
                fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>پاک همه</button>
          )}
          <span style={{
            fontSize: 'var(--fs-xs)', color: 'var(--muted)',
            fontWeight: 700, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            padding: '4px 10px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
          }}>
            {count === total ? `${total} مورد` : `${count} از ${total}`}
          </span>
        </div>
      </div>

      {/* ═══ چیپ‌های فیلتر فعال ═══ */}
      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 'var(--sp-2)',
          padding: 'var(--sp-2) var(--sp-3)',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--sp-1)',
              padding: '5px 8px 5px 10px', height: 30,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 999,
              color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {c.icon && <span style={{ fontSize: 13, lineHeight: 1, display: 'inline-flex' }}>{c.icon}</span>}
              <span style={{ opacity: 0.75, fontWeight: 600 }}>{c.label}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{c.text}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, marginRight: 2,
                  background: 'var(--accent)', color: 'var(--avatar-text)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0, lineHeight: 1,
                }}><IconX size={11} /></button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sheet فیلترها ═══ */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {filterDefs.map(def => {
            const v = filterState[def.key];

            // ═══ enum ═══
            if (def.kind === 'enum') {
              const isMulti = !!def.multi;
              const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
              const noneActive = isMulti ? arr.length === 0 : !v;
              const activeNow = isMulti ? arr.length : (v ? 1 : 0);
              const chip = (active: boolean): React.CSSProperties => ({
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 36, padding: '0 var(--sp-3)',
                background: active ? 'var(--accent)' : 'var(--bg)',
                border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 999,
                color: active ? 'var(--avatar-text)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                fontWeight: active ? 700 : 500, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--dur-fast) var(--ease-out)',
              });
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-3) var(--sp-3) var(--sp-4)',
                  boxShadow: 'var(--elev-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                    <GroupIcon icon={def.icon} active={activeNow > 0} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                        {def.label}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>
                        {activeNow > 0 ? `${activeNow} مورد انتخاب شده` : 'همه نمایش داده می‌شود'}
                      </div>
                    </div>
                    {activeNow > 0 && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--muted)', fontFamily: 'inherit',
                          fontSize: 'var(--fs-xs)', fontWeight: 700,
                          cursor: 'pointer', padding: '4px 6px',
                        }}>پاک</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
                    <button type="button"
                      onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
                      style={chip(noneActive)}>همه</button>
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
                          style={chip(active)}>
                          {o.icon && <span style={{ fontSize: 14, lineHeight: 1, display: 'inline-flex' }}>{o.icon}</span>}
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
              const chip = (active: boolean): React.CSSProperties => ({
                height: 36, padding: '0 var(--sp-4)',
                background: active ? 'var(--accent)' : 'var(--bg)',
                border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 999,
                color: active ? 'var(--avatar-text)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                fontWeight: active ? 700 : 500, cursor: 'pointer',
              });
              const activeNow = v === true || v === false;
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-3) var(--sp-3) var(--sp-4)',
                  boxShadow: 'var(--elev-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
                    <GroupIcon icon={def.icon} active={activeNow} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{def.label}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {activeNow ? (v ? 'فقط بله' : 'فقط خیر') : 'همه نمایش داده می‌شود'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                    <button type="button" onClick={() => clearFilter(def.key)}
                      style={chip(v === undefined || v === null)}>همه</button>
                    <button type="button" onClick={() => setFilter(def.key, true)}
                      style={chip(v === true)}>بله</button>
                    <button type="button" onClick={() => setFilter(def.key, false)}
                      style={chip(v === false)}>خیر</button>
                  </div>
                </div>
              );
            }

            // ═══ dateRange ═══
            if (def.kind === 'dateRange') {
              const [a, b] = (v as [string, string]) || ['', ''];
              const activeNow = !!(a || b);
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-3)',
                  boxShadow: 'var(--elev-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                    <GroupIcon icon={def.icon} active={activeNow} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{def.label}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {activeNow ? `${a || '?'} تا ${b || '?'}` : 'محدوده‌ای انتخاب نشده'}
                      </div>
                    </div>
                    {activeNow && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--muted)', fontFamily: 'inherit',
                          fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer',
                        }}>پاک</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                    <Input placeholder="از تاریخ" value={a || ''}
                      onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0, fontWeight: 700 }}>تا</span>
                    <Input placeholder="تا تاریخ" value={b || ''}
                      onChange={e => setFilter(def.key, [a || '', e.target.value])} />
                  </div>
                </div>
              );
            }

            // ═══ numberRange ═══
            if (def.kind === 'numberRange') {
              const [a, b] = (v as [number, number]) || [null, null];
              const activeNow = a != null || b != null;
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: 'var(--sp-3)',
                  boxShadow: 'var(--elev-1)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)' }}>
                    <GroupIcon icon={def.icon} active={activeNow} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{def.label}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {activeNow ? `${a ?? '?'} تا ${b ?? '?'}` : 'محدوده‌ای انتخاب نشده'}
                      </div>
                    </div>
                    {activeNow && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--muted)', fontFamily: 'inherit',
                          fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer',
                        }}>پاک</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center' }}>
                    <Input type="number" placeholder="از" value={a ?? ''}
                      onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
                    <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)', flexShrink: 0, fontWeight: 700 }}>تا</span>
                    <Input type="number" placeholder="تا" value={b ?? ''}
                      onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-2)' }}>
          <Btn onClick={resetAll} full>پاک‌سازی</Btn>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={15} /> تأیید
            </span>
          </Btn>
        </div>
      </Sheet>

      {/* ═══ Sheet مرتب‌سازی ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
          {sortDefs.map(def => {
            const active = sortState?.key === def.key;
            const dir = sortState?.dir || 'asc';
            return (
              <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                  width: '100%', padding: 'var(--sp-3)', minHeight: 60,
                  background: active ? 'var(--accent-soft)' : 'var(--card)',
                  border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 'var(--r-lg)',
                  color: 'var(--text)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'right',
                  boxShadow: active ? 'var(--elev-2)' : 'var(--elev-1)',
                  transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                <GroupIcon icon={def.icon} active={active} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-md)', fontWeight: 700,
                    color: active ? 'var(--accent)' : 'var(--text)',
                    lineHeight: 1.2,
                  }}>{def.label}</div>
                  <div style={{
                    fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                    marginTop: 3, fontWeight: 500,
                  }}>
                    {active
                      ? (dir === 'asc' ? 'صعودی — از کوچک به بزرگ' : 'نزولی — از بزرگ به کوچک')
                      : (def.hint || 'برای مرتب‌سازی لمس کن')}
                  </div>
                </div>
                {active && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 30, height: 30, flexShrink: 0,
                    background: 'var(--accent)',
                    color: 'var(--avatar-text)',
                    borderRadius: '50%',
                    lineHeight: 1,
                  }}>
                    {dir === 'asc' ? <IconArrowUp size={15} /> : <IconArrowDown size={15} />}
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
