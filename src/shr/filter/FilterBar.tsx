/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * طراحی کارت-محور: هر گروه یه کارت جدا، تاچ بزرگ، بدون Native Select
 */
import { useState } from 'react';
import { Sheet, Input, Btn } from '../components/ui';
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

function summarizeChip<T>(def: FilterDef<T>, v: any): { text: string; icon?: string } | null {
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
      return { key: def.key, label: def.label, icon: def.icon, ...sum };
    })
    .filter(Boolean) as Array<{ key: string; label: string; icon?: string; text: string; icon2?: string }>;

  const sortLabel = sortState
    ? (sortDefs.find(s => s.key === sortState.key)?.label || '') +
      (sortState.dir === 'asc' ? ' ↑' : ' ↓')
    : null;

  // ═══ دکمه‌های بالای نوار ═══
  const topBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 6, height: 36, padding: '0 14px',
    background: active ? 'var(--accent)' : 'var(--card)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 10,
    color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    boxShadow: active ? '0 3px 10px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.03)',
    transition: 'all .15s ease',
  });

  return (
    <>
      {/* ═══ نوار فوقانی ═══ */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button type="button" onClick={() => setOpenFilters(true)}
          aria-label="فیلترها" style={topBtn(activeCount > 0)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>فیلتر</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 5px',
              background: 'rgba(255,255,255,0.28)', color: 'inherit',
              borderRadius: 9, fontSize: 10.5, fontWeight: 800,
            }}>{activeCount}</span>
          )}
        </button>

        {sortDefs.length > 0 && (
          <button type="button" onClick={() => setOpenSort(true)}
            aria-label="مرتب‌سازی" style={topBtn(!!sortState)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h13M3 12h9M3 18h5"/>
              <path d="M18 9l3-3 3 3M21 6v12"/>
            </svg>
            <span>{sortLabel || 'مرتب'}</span>
          </button>
        )}

        <div style={{
          marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: 6,
        }}>
          {hasActiveFilters && (
            <button type="button" onClick={resetAll} aria-label="پاک‌سازی"
              style={{
                background: 'none', border: 'none', padding: '4px 6px',
                color: 'var(--danger)', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>پاک همه</button>
          )}
          <span style={{
            fontSize: 11.5, color: 'var(--muted)',
            fontWeight: 700, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
            padding: '4px 8px',
            background: 'var(--input-bg)',
            borderRadius: 8,
          }}>
            {count === total ? `${total} مورد` : `${count} / ${total}`}
          </span>
        </div>
      </div>

      {/* ═══ چیپ‌های فیلتر فعال ═══ */}
      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, padding: '8px 12px',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', height: 30,
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 999,
              color: 'var(--accent)', fontSize: 11.5, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {c.icon2 && <span style={{ fontSize: 13, lineHeight: 1 }}>{c.icon2}</span>}
              <span style={{ color: 'var(--accent)', opacity: 0.7, fontWeight: 600 }}>{c.label}</span>
              <span style={{ color: 'var(--accent)', opacity: 0.4 }}>•</span>
              <span>{c.text}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 18, height: 18, marginRight: 2,
                  background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0,
                  fontFamily: 'inherit', fontSize: 10, fontWeight: 800,
                  lineHeight: 1,
                }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sheet فیلترها — کارت‌محور ═══ */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filterDefs.map(def => {
            const v = filterState[def.key];

            // ═══ enum گروه ═══
            if (def.kind === 'enum') {
              const isMulti = !!def.multi;
              const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
              const noneActive = isMulti ? arr.length === 0 : !v;
              const activeNow = isMulti ? arr.length : (v ? 1 : 0);
              const chip = (active: boolean): React.CSSProperties => ({
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 36, padding: '0 14px',
                background: active ? 'var(--accent)' : 'var(--bg)',
                border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 999,
                color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 12.5,
                fontWeight: active ? 700 : 500, cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all .12s ease',
              });
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '14px 14px 16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}>
                  {/* header کارت */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    marginBottom: 14,
                  }}>
                    {def.icon && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, flexShrink: 0,
                        background: 'var(--input-bg)',
                        borderRadius: 10, fontSize: 16, lineHeight: 1,
                      }}>{def.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700,
                        color: 'var(--text)', lineHeight: 1.2,
                      }}>{def.label}</div>
                      <div style={{
                        fontSize: 11, color: 'var(--muted)',
                        fontWeight: 500, marginTop: 2,
                      }}>
                        {activeNow > 0 ? `${activeNow} مورد انتخاب شده` : 'همه نمایش داده می‌شود'}
                      </div>
                    </div>
                    {activeNow > 0 && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--danger)', fontFamily: 'inherit',
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                          padding: '4px 6px',
                        }}>پاک</button>
                    )}
                  </div>
                  {/* چیپ‌ها */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
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
                          {o.icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{o.icon}</span>}
                          <span>{o.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }

            // ═══ boolean گروه ═══
            if (def.kind === 'boolean') {
              const chip = (active: boolean): React.CSSProperties => ({
                height: 36, padding: '0 16px',
                background: active ? 'var(--accent)' : 'var(--bg)',
                border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 999,
                color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 12.5,
                fontWeight: active ? 700 : 500, cursor: 'pointer',
              });
              const activeNow = v === true || v === false;
              return (
                <div key={def.key} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 14, padding: '14px 14px 16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    {def.icon && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, flexShrink: 0,
                        background: 'var(--input-bg)', borderRadius: 10,
                        fontSize: 16, lineHeight: 1,
                      }}>{def.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                        {def.label}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, marginTop: 2 }}>
                        {activeNow ? (v ? 'فقط بله' : 'فقط خیر') : 'همه نمایش داده می‌شود'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 7 }}>
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
                  borderRadius: 14, padding: '14px 14px 16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    {def.icon && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, flexShrink: 0,
                        background: 'var(--input-bg)', borderRadius: 10,
                        fontSize: 16, lineHeight: 1,
                      }}>{def.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{def.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {activeNow ? `${a || '?'} تا ${b || '?'}` : 'محدوده‌ای انتخاب نشده'}
                      </div>
                    </div>
                    {activeNow && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--danger)', fontFamily: 'inherit',
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        }}>پاک</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input placeholder="از تاریخ" value={a || ''}
                      onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                    <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0, fontWeight: 600 }}>تا</span>
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
                  borderRadius: 14, padding: '14px 14px 16px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    {def.icon && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, flexShrink: 0,
                        background: 'var(--input-bg)', borderRadius: 10,
                        fontSize: 16, lineHeight: 1,
                      }}>{def.icon}</span>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{def.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                        {activeNow ? `${a ?? '?'} تا ${b ?? '?'}` : 'محدوده‌ای انتخاب نشده'}
                      </div>
                    </div>
                    {activeNow && (
                      <button type="button" onClick={() => clearFilter(def.key)}
                        style={{
                          background: 'none', border: 'none',
                          color: 'var(--danger)', fontFamily: 'inherit',
                          fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        }}>پاک</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Input type="number" placeholder="از" value={a ?? ''}
                      onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
                    <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0, fontWeight: 600 }}>تا</span>
                    <Input type="number" placeholder="تا" value={b ?? ''}
                      onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 14, paddingBottom: 8 }}>
          <Btn onClick={resetAll} full>پاک‌سازی</Btn>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>تأیید</Btn>
        </div>
      </Sheet>

      {/* ═══ Sheet مرتب‌سازی — کارت بزرگ ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortDefs.map(def => {
            const active = sortState?.key === def.key;
            const dir = sortState?.dir || 'asc';
            return (
              <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%', padding: '14px 14px', minHeight: 60,
                  background: active ? 'var(--accent-soft)' : 'var(--card)',
                  border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 14,
                  color: 'var(--text)',
                  fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'right',
                  boxShadow: active ? '0 3px 12px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'all .15s ease',
                }}>
                {def.icon && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 38, height: 38, flexShrink: 0,
                    background: active ? 'var(--accent)' : 'var(--input-bg)',
                    color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
                    borderRadius: 11, fontSize: 18, lineHeight: 1,
                  }}>{def.icon}</span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: active ? 'var(--accent)' : 'var(--text)',
                    lineHeight: 1.2,
                  }}>{def.label}</div>
                  <div style={{
                    fontSize: 11, color: 'var(--muted)',
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
                    width: 28, height: 28, flexShrink: 0,
                    background: 'var(--accent)',
                    color: 'var(--avatar-text, #fff)',
                    borderRadius: '50%',
                    fontSize: 14, fontWeight: 800, lineHeight: 1,
                  }}>
                    {dir === 'asc' ? '↑' : '↓'}
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
