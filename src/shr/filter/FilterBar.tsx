/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * طراحی موبایل-اول: کم‌ارتفاع، آیکون-محور، بدون Native Select
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
      return { key: def.key, label: def.label, ...sum };
    })
    .filter(Boolean) as Array<{ key: string; label: string; text: string; icon?: string }>;

  const sortLabel = sortState
    ? (sortDefs.find(s => s.key === sortState.key)?.label || '') +
      (sortState.dir === 'asc' ? ' ↑' : ' ↓')
    : null;

  // دکمه‌ی آیکونی نازک
  const iconBtn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 5,
    height: 34, padding: '0 12px',
    background: active ? 'var(--accent)' : 'var(--card)',
    border: '1px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 999,
    color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    boxShadow: active ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
    transition: 'all .15s ease',
  });

  return (
    <>
      {/* ═══ نوار فوقانی باریک ═══ */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 12px',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        {/* سمت چپ: دکمه فیلتر */}
        <button type="button" onClick={() => setOpenFilters(true)}
          aria-label="فیلترها" style={iconBtn(activeCount > 0)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span>فیلتر</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 16, height: 16, padding: '0 4px',
              background: 'rgba(255,255,255,0.25)', color: 'inherit',
              borderRadius: 8, fontSize: 10, fontWeight: 800, marginRight: -2,
            }}>{activeCount}</span>
          )}
        </button>

        {/* دکمه مرتب‌سازی */}
        {sortDefs.length > 0 && (
          <button type="button" onClick={() => setOpenSort(true)}
            aria-label="مرتب‌سازی" style={iconBtn(!!sortState)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h13M3 12h9M3 18h5"/>
              <path d="M18 9l3-3 3 3M21 6v12"/>
            </svg>
            <span>{sortLabel || 'مرتب'}</span>
          </button>
        )}

        {/* شمارنده + پاک‌سازی */}
        <div style={{
          marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8,
          paddingLeft: 4,
        }}>
          {hasActiveFilters && (
            <button type="button" onClick={resetAll} aria-label="پاک‌سازی"
              style={{
                background: 'none', border: 'none', padding: '4px 6px',
                color: 'var(--muted)', fontFamily: 'inherit',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>پاک همه</button>
          )}
          <span style={{
            fontSize: 11, color: 'var(--muted)',
            fontWeight: 600, whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {count === total ? `${total} مورد` : `${count} / ${total}`}
          </span>
        </div>
      </div>

      {/* ═══ چیپ‌های فیلتر فعال — زیر نوار ═══ */}
      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px 12px 8px',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 8px 5px 10px',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 999,
              color: 'var(--accent)', fontSize: 11.5, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {c.icon && <span style={{ fontSize: 13, lineHeight: 1 }}>{c.icon}</span>}
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{c.label}</span>
              <span>·</span>
              <span>{c.text}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, marginRight: 2,
                  background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', padding: 0,
                  fontFamily: 'inherit', fontSize: 10, fontWeight: 700,
                  lineHeight: 1,
                }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sheet فیلترها ═══ */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        {filterDefs.map(def => {
          const v = filterState[def.key];

          // header مشترک هر گروه
          const groupHeader = (active: boolean) => (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 10, paddingRight: 2,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}>
                {def.label}
              </span>
              {active && (
                <button type="button"
                  onClick={() => clearFilter(def.key)}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--danger)', fontFamily: 'inherit',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    padding: '2px 4px',
                  }}>پاک</button>
              )}
            </div>
          );

          if (def.kind === 'enum') {
            const isMulti = !!def.multi;
            const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
            const noneActive = isMulti ? arr.length === 0 : !v;
            const hasSomeActive = !noneActive;
            const chip = (active: boolean): React.CSSProperties => ({
              display: 'inline-flex', alignItems: 'center', gap: 5,
              height: 36, padding: '0 14px',
              background: active ? 'var(--accent)' : 'var(--input-bg)',
              border: '1.5px solid ' + (active ? 'var(--accent)' : 'transparent'),
              borderRadius: 999,
              color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
              fontFamily: 'inherit', fontSize: 12.5,
              fontWeight: active ? 700 : 500, cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all .12s ease',
            });
            return (
              <div key={def.key} style={{ marginBottom: 20 }}>
                {groupHeader(hasSomeActive)}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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

          if (def.kind === 'boolean') {
            const chip = (active: boolean): React.CSSProperties => ({
              height: 36, padding: '0 14px',
              background: active ? 'var(--accent)' : 'var(--input-bg)',
              border: '1.5px solid ' + (active ? 'var(--accent)' : 'transparent'),
              borderRadius: 999,
              color: active ? 'var(--avatar-text, #fff)' : 'var(--text)',
              fontFamily: 'inherit', fontSize: 12.5,
              fontWeight: active ? 700 : 500, cursor: 'pointer',
            });
            const active = v === true || v === false;
            return (
              <div key={def.key} style={{ marginBottom: 20 }}>
                {groupHeader(active)}
                <div style={{ display: 'flex', gap: 6 }}>
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

          if (def.kind === 'dateRange') {
            const [a, b] = (v as [string, string]) || ['', ''];
            return (
              <div key={def.key} style={{ marginBottom: 20 }}>
                {groupHeader(!!(a || b))}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input placeholder="از" value={a || ''}
                    onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                  <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0 }}>تا</span>
                  <Input placeholder="تا" value={b || ''}
                    onChange={e => setFilter(def.key, [a || '', e.target.value])} />
                </div>
              </div>
            );
          }

          if (def.kind === 'numberRange') {
            const [a, b] = (v as [number, number]) || [null, null];
            return (
              <div key={def.key} style={{ marginBottom: 20 }}>
                {groupHeader(a != null || b != null)}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input type="number" placeholder="از" value={a ?? ''}
                    onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
                  <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0 }}>تا</span>
                  <Input type="number" placeholder="تا" value={b ?? ''}
                    onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
                </div>
              </div>
            );
          }
          return null;
        })}

        <div style={{ display: 'flex', gap: 8, paddingTop: 8, paddingBottom: 8 }}>
          <Btn onClick={resetAll} full>پاک‌سازی همه</Btn>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>تأیید</Btn>
        </div>
      </Sheet>

      {/* ═══ Sheet مرتب‌سازی ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sortDefs.map(def => {
            const active = sortState?.key === def.key;
            return (
              <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  width: '100%', padding: '14px 16px', minHeight: 52,
                  background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: '1.5px solid ' + (active ? 'var(--accent)' : 'transparent'),
                  borderRadius: 14,
                  color: active ? 'var(--accent)' : 'var(--text)',
                  fontFamily: 'inherit', fontSize: 14,
                  fontWeight: active ? 700 : 500, cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all .12s ease',
                }}>
                <span>{def.label}</span>
                {active ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 800,
                    padding: '3px 10px', borderRadius: 999,
                    background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
                  }}>
                    {sortState?.dir === 'asc' ? 'صعودی' : 'نزولی'}
                    <span style={{ fontSize: 13 }}>
                      {sortState?.dir === 'asc' ? '↑' : '↓'}
                    </span>
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.6 }}>
                    برای مرتب‌سازی لمس کن
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
