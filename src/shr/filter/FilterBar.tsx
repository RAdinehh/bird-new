/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * طراحی موبایل-اول: بدون Native Select، تاچ بزرگ، حداقل ارتفاع
 */
import { useState } from 'react';
import { Sheet, Field, Input, Btn } from '../components/ui';
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

function summarizeChip<T>(def: FilterDef<T>, v: any): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (Array.isArray(v) && (v.length === 0 || v.every((x: any) => x === ''))) return null;
  if (def.kind === 'enum') {
    const arr = Array.isArray(v) ? (v as string[]) : [String(v)];
    const labels = arr.map(x => def.options?.find(o => o.value === x)?.label || x);
    if (labels.length === 1) return labels[0];
    if (labels.length === 2) return labels.join('، ');
    return `${labels[0]} +${labels.length - 1}`;
  }
  if (def.kind === 'dateRange') {
    const [a, b] = v as [string, string];
    return `${a || '?'} تا ${b || '?'}`;
  }
  if (def.kind === 'numberRange') {
    const [a, b] = v as [number, number];
    return `${a ?? '?'}–${b ?? '?'}`;
  }
  if (def.kind === 'boolean') return v ? 'بله' : 'خیر';
  return String(v);
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
      const label = summarizeChip(def, v);
      if (!label) return null;
      return { key: def.key, label: def.label, value: label };
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  const sortLabel = sortState
    ? (sortDefs.find(s => s.key === sortState.key)?.label || '') +
      (sortState.dir === 'asc' ? ' ↑' : ' ↓')
    : null;

  const btn = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 10px', minHeight: 34,
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 10,
    color: active ? 'var(--accent)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  });

  // ─── چیپ‌های داخل Sheet ───
  const chipIn = (active: boolean): React.CSSProperties => ({
    padding: '8px 12px', minHeight: 38,
    background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
    border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
    borderRadius: 10,
    color: active ? 'var(--accent)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 13,
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    whiteSpace: 'nowrap',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  });

  return (
    <>
      {/* ═══ نوار بالا — باریک ═══ */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <button type="button" onClick={() => setOpenFilters(true)}
          style={btn(activeCount > 0)} aria-label="فیلترها">
          <span>🔍</span>
          <span>فیلتر</span>
          {activeCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 4px',
              background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
              borderRadius: 9, fontSize: 10, fontWeight: 800,
            }}>{activeCount}</span>
          )}
        </button>

        {sortDefs.length > 0 && (
          <button type="button" onClick={() => setOpenSort(true)}
            style={btn(!!sortState)} aria-label="مرتب‌سازی">
            <span>⇅</span>
            <span>{sortLabel || 'مرتب'}</span>
          </button>
        )}

        {hasActiveFilters && (
          <button type="button" onClick={resetAll} aria-label="پاک‌سازی"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '6px 10px', minHeight: 34,
              background: 'none', border: 'none',
              color: 'var(--danger)', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>✕ پاک</button>
        )}

        <span style={{
          marginRight: 'auto', fontSize: 11, color: 'var(--muted)',
          fontWeight: 600, whiteSpace: 'nowrap', paddingRight: 4,
        }}>
          {count === total ? `${total} مورد` : `${count} از ${total}`}
        </span>
      </div>

      {/* ═══ چیپ‌های فیلتر فعال ═══ */}
      {chips.length > 0 && (
        <div style={{
          display: 'flex', gap: 5, padding: '6px 12px 8px',
          alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
          background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)', borderRadius: 20,
              color: 'var(--accent)', fontSize: 11, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{c.label}:</span>
              <span>{c.value}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{
                  background: 'none', border: 'none', color: 'var(--accent)',
                  cursor: 'pointer', padding: 0, marginRight: 2,
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                  lineHeight: 1, display: 'inline-flex', alignItems: 'center',
                }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ Sheet فیلترها ═══ */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        {filterDefs.map(def => {
          const v = filterState[def.key];

          if (def.kind === 'enum') {
            const isMulti = !!def.multi;
            const arr = isMulti ? (Array.isArray(v) ? (v as string[]) : []) : [];
            const noneActive = isMulti ? arr.length === 0 : !v;
            return (
              <div key={def.key} style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: 'var(--text)',
                  marginBottom: 8, paddingRight: 2,
                }}>{def.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <button type="button"
                    onClick={() => { isMulti ? setFilter(def.key, []) : clearFilter(def.key); }}
                    style={chipIn(noneActive)}>
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
                        style={chipIn(active)}>
                        {o.icon && <span>{o.icon}</span>}
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (def.kind === 'boolean') {
            return (
              <div key={def.key} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{def.label}</div>
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

          if (def.kind === 'dateRange') {
            const [a, b] = (v as [string, string]) || ['', ''];
            return (
              <Field key={def.key} label={def.label}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input placeholder="از" value={a || ''}
                    onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                  <Input placeholder="تا" value={b || ''}
                    onChange={e => setFilter(def.key, [a || '', e.target.value])} />
                </div>
              </Field>
            );
          }

          if (def.kind === 'numberRange') {
            const [a, b] = (v as [number, number]) || [null, null];
            return (
              <Field key={def.key} label={def.label}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input type="number" placeholder="از" value={a ?? ''}
                    onChange={e => setFilter(def.key, [e.target.value ? Number(e.target.value) : null, b ?? null])} />
                  <Input type="number" placeholder="تا" value={b ?? ''}
                    onChange={e => setFilter(def.key, [a ?? null, e.target.value ? Number(e.target.value) : null])} />
                </div>
              </Field>
            );
          }
          return null;
        })}

        <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
          <Btn onClick={resetAll} full>پاک‌سازی</Btn>
          <Btn variant="primary" onClick={() => setOpenFilters(false)} full>تأیید</Btn>
        </div>
      </Sheet>

      {/* ═══ Sheet مرتب‌سازی ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        {sortDefs.map(def => {
          const active = sortState?.key === def.key;
          return (
            <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '12px 14px', minHeight: 48,
                background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                border: '1.5px solid ' + (active ? 'var(--accent)' : 'var(--border)'),
                borderRadius: 12,
                color: active ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 14,
                fontWeight: active ? 700 : 500, cursor: 'pointer',
                marginBottom: 8, textAlign: 'right',
              }}>
              <span>{def.label}</span>
              {active && (
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  padding: '3px 8px', borderRadius: 6,
                  background: 'var(--accent)', color: 'var(--avatar-text, #fff)',
                }}>
                  {sortState?.dir === 'asc' ? 'صعودی ↑' : 'نزولی ↓'}
                </span>
              )}
            </button>
          );
        })}
      </Sheet>
    </>
  );
}
