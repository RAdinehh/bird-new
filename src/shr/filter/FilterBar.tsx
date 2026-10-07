/**
 * filter/FilterBar.tsx — نوار فیلتر مرکزی
 * شامل: جستجو + دکمه فیلتر + دکمه sort + چیپ‌های فعال
 */
import { useState } from 'react';
import { Sheet, Field, Input, Select, Btn } from '../components/ui';
import type { FilterDef, SortDef, FilterState, SortState } from './types';

interface Props<T> {
  filterDefs: FilterDef<T>[];
  sortDefs: SortDef<T>[];
  filterState: FilterState;
  sortState: SortState | null;
  search: string;
  setSearch: (s: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  setSort: (s: SortState | null) => void;
  toggleSort: (key: string) => void;
  resetAll: () => void;
  hasActiveFilters: boolean;
  total: number;
  count: number;
  placeholder?: string;
}

export function FilterBar<T>({
  filterDefs, sortDefs, filterState, sortState, search, setSearch,
  setFilter, clearFilter, setSort: _setSort, toggleSort, resetAll,
  hasActiveFilters, total, count, placeholder = 'جستجو...',
}: Props<T>) {
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);

  const activeCount = Object.keys(filterState).filter(k => {
    const v = filterState[k];
    if (v === undefined || v === null || v === '') return false;
    if (Array.isArray(v)) return v.length > 0 && v.some(x => x !== '');
    return true;
  }).length;

  // چیپ‌های فیلتر فعال
  const chips = filterDefs
    .map(def => {
      const v = filterState[def.key];
      if (v === undefined || v === null || v === '') return null;
      if (Array.isArray(v) && (v.length === 0 || v.every(x => x === ''))) return null;
      let label = '';
      if (def.kind === 'enum') {
        if (Array.isArray(v)) {
          label = (v as string[]).map(x => def.options?.find(o => o.value === x)?.label || x).join('، ');
        } else {
          label = def.options?.find(o => o.value === v)?.label || String(v);
        }
      } else if (def.kind === 'dateRange') {
        const [a, b] = v as [string, string];
        label = (a || '?') + ' تا ' + (b || '?');
      } else if (def.kind === 'numberRange') {
        const [a, b] = v as [number, number];
        label = `${a ?? '?'} تا ${b ?? '?'}`;
      } else if (def.kind === 'boolean') {
        label = v ? 'بله' : 'خیر';
      }
      return { key: def.key, label: def.label, value: label };
    })
    .filter(Boolean) as Array<{ key: string; label: string; value: string }>;

  const sortLabel = sortState
    ? (sortDefs.find(s => s.key === sortState.key)?.label || '') +
      (sortState.dir === 'asc' ? ' ↑' : ' ↓')
    : null;

  return (
    <>
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px', alignItems: 'center',
        overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
      }}>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 120, fontSize: 'var(--fs-sm)' }}
        />
        {filterDefs.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenFilters(true)}
            style={{
              padding: '6px 10px',
              background: activeCount > 0 ? 'var(--accent-soft)' : 'var(--btn-bg)',
              border: '1px solid ' + (activeCount > 0 ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 'var(--r-sm)',
              color: activeCount > 0 ? 'var(--accent)' : 'var(--text)',
              fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            🔍 فیلتر{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
        )}
        {sortDefs.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenSort(true)}
            style={{
              padding: '6px 10px',
              background: sortState ? 'var(--accent-soft)' : 'var(--btn-bg)',
              border: '1px solid ' + (sortState ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 'var(--r-sm)',
              color: sortState ? 'var(--accent)' : 'var(--text)',
              fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ⇅ {sortLabel || 'مرتب‌سازی'}
          </button>
        )}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetAll}
            style={{
              padding: '6px 10px', background: 'none', border: 'none',
              color: 'var(--danger)', fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)', fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            ✕ پاک‌سازی
          </button>
        )}
      </div>

      {(chips.length > 0 || (count !== total && (search || hasActiveFilters))) && (
        <div style={{
          display: 'flex', gap: 6, padding: '6px 12px', alignItems: 'center',
          overflowX: 'auto', scrollbarWidth: 'none',
          borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 8px', background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)',
              color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              <span style={{ color: 'var(--muted)' }}>{c.label}:</span>
              <span>{c.value}</span>
              <button type="button" onClick={() => clearFilter(c.key)}
                aria-label="حذف فیلتر"
                style={{ background: 'none', border: 'none', color: 'var(--accent)',
                  cursor: 'pointer', padding: '0 2px', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 700 }}>✕</button>
            </div>
          ))}
          {count !== total && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {count} از {total}
            </span>
          )}
        </div>
      )}

      {/* Sheet فیلترها */}
      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها">
        {filterDefs.map(def => {
          const v = filterState[def.key];
          if (def.kind === 'enum') {
            return (
              <Field key={def.key} label={def.label}>
                {def.multi ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {def.options?.map(o => {
                      const arr = Array.isArray(v) ? (v as string[]) : [];
                      const active = arr.includes(o.value);
                      return (
                        <button key={o.value} type="button"
                          onClick={() => {
                            const next = active
                              ? arr.filter(x => x !== o.value)
                              : [...arr, o.value];
                            setFilter(def.key, next);
                          }}
                          style={{
                            padding: '6px 10px',
                            background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                            border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                            borderRadius: 'var(--r-sm)',
                            color: active ? 'var(--accent)' : 'var(--text)',
                            fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                            fontWeight: active ? 700 : 500, cursor: 'pointer',
                          }}>
                          {o.icon ? o.icon + ' ' : ''}{o.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <Select value={(v as string) || ''} onChange={e => setFilter(def.key, e.target.value)}>
                    <option value="">— همه —</option>
                    {def.options?.map(o => (
                      <option key={o.value} value={o.value}>{o.icon ? o.icon + ' ' : ''}{o.label}</option>
                    ))}
                  </Select>
                )}
              </Field>
            );
          }
          if (def.kind === 'dateRange') {
            const [a, b] = (v as [string, string]) || ['', ''];
            return (
              <Field key={def.key} label={def.label}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input type="text" placeholder="از" value={a || ''}
                    onChange={e => setFilter(def.key, [e.target.value, b || ''])} />
                  <Input type="text" placeholder="تا" value={b || ''}
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
          if (def.kind === 'boolean') {
            return (
              <Field key={def.key} label={def.label}>
                <Select value={v === true ? '1' : v === false ? '0' : ''}
                  onChange={e => setFilter(def.key, e.target.value === '' ? null : e.target.value === '1')}>
                  <option value="">— همه —</option>
                  <option value="1">بله</option>
                  <option value="0">خیر</option>
                </Select>
              </Field>
            );
          }
          return null;
        })}
        <div style={{ display: 'flex', gap: 6, paddingTop: 8 }}>
          <Btn full onClick={resetAll}>پاک‌سازی همه</Btn>
          <Btn full variant="primary" onClick={() => setOpenFilters(false)}>تأیید</Btn>
        </div>
      </Sheet>

      {/* Sheet مرتب‌سازی */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        {sortDefs.map(def => {
          const active = sortState?.key === def.key;
          return (
            <button key={def.key} type="button" onClick={() => toggleSort(def.key)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%', padding: '10px 12px',
                background: active ? 'var(--accent-soft)' : 'var(--input-bg)',
                border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-sm)',
                color: active ? 'var(--accent)' : 'var(--text)',
                fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                fontWeight: active ? 700 : 500, cursor: 'pointer',
                marginBottom: 6, textAlign: 'right',
              }}>
              <span>{def.label}</span>
              {active && <span>{sortState?.dir === 'asc' ? '↑ صعودی' : '↓ نزولی'}</span>}
            </button>
          );
        })}
      </Sheet>
    </>
  );
}
