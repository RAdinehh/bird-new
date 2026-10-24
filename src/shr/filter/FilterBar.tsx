/**
 * filter/FilterBar.tsx — نوار فیلتر و مرتب‌سازی مرکزی
 * طراحی: Tabs بین گروه‌ها + ردیف‌های بلند + بدون گرادیانت
 */
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Sheet, Input, Btn } from '../components/ui';
import {
  IconFilter, IconSort, IconX, IconArrowUp, IconArrowDown, IconCheck,
} from '../icons';
import type { FilterDef, SortDef, FilterState, SortState } from './types';
import { summarizeChip, isEmptyVal } from './filterHelpers';
import { FilterGroupBody } from './FilterGroupBody';
import { toFa } from '../utils/fa';

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
  sortStack?: SortState[];
  appendSort?: (key: string) => void;
  groupBy?: string;
  setGroupBy?: (val: string) => void;
  recycleCount?: number;
  onOpenRecycleBin?: () => void;
  hasActiveFilters: boolean;
  total: number;
  count: number;
}


export function FilterBar<T>({
  filterDefs, sortDefs, filterState, sortState,
  setFilter, clearFilter, setSort: _setSort, toggleSort, resetAll,
  hasActiveFilters: _hasActiveFilters, total, count,
  sortStack = sortState ? [sortState] : [],
  appendSort,
  groupBy = 'none',
  setGroupBy,
  recycleCount = 0,
  onOpenRecycleBin,
}: Props<T>) {
  const [openFilters, setOpenFilters] = useState(false);
  const [openSort, setOpenSort] = useState(false);
  const [openGroup, setOpenGroup] = useState(false);

  // 🆕 الگوی useTabBadge: پالس ۵ ثانیه‌ای فقط وقتی تعداد زیاد می‌شود
  const [isPulsing, setIsPulsing] = useState(false);
  const prevRecycleCount = useRef(recycleCount);
  const pulseTimer = useRef<number | null>(null);

  useEffect(() => {
    if (recycleCount > prevRecycleCount.current) {
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
      setIsPulsing(true);
      pulseTimer.current = window.setTimeout(() => setIsPulsing(false), 5000);
    } else if (recycleCount === 0) {
      setIsPulsing(false);
    }
    prevRecycleCount.current = recycleCount;
  }, [recycleCount]);

  useEffect(() => {
    return () => {
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);


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
      const [a, b] = v as [unknown, unknown];
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
    borderRadius: 'var(--r-md)',
    color: active ? 'var(--avatar-text)' : 'var(--text)',
    fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'all var(--dur-fast) var(--ease-out)',
  });



  return (
    <>
      <div style={{
        display: 'flex', gap: 'var(--sp-2)',
        padding: 'var(--sp-2) var(--sp-3)',
        alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)', background: 'var(--bg)',
        touchAction: 'pan-x',
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
              borderRadius: 'var(--r-md)', fontSize: 'var(--fs-2xs)', fontWeight: 800,
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
        
        {setGroupBy && (
          <button type="button" onClick={() => setOpenGroup(true)}
            aria-label="گروه‌بندی" style={topBtn(groupBy !== 'none')}>
            <span>📁</span>
            <span>{groupBy !== 'none' ? 'گروه‌بندی' : 'گروه'}</span>
          </button>
        )}
        
        {onOpenRecycleBin && recycleCount > 0 && (
          <button
            type="button"
            onClick={onOpenRecycleBin}
            style={{
              ...topBtn(true),
              position: 'relative',
              cursor: 'pointer',
            }}
            title={`${toFa(recycleCount)} فاکتور در سبد بازیابی`}
          >
            <span>🗑️</span>
            <span>بازیابی ({toFa(recycleCount)})</span>
            <span
              aria-label="آیتم جدید"
              style={{
                position: 'absolute', top: -2, left: -2,
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--danger)',
                boxShadow: '0 0 0 2px var(--bg)',
                animation: isPulsing ? 'flkDotPulse 1s ease-in-out infinite' : 'none',
              }}
            />
          </button>
        )}

        {activeCount > 0 && (
          <button type="button" onClick={resetAll}
            aria-label="پاک کردن فیلترها"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, padding: 0,
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--muted)',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all var(--dur-fast) var(--ease-out)',
            }}>
            <IconX size={13} />
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
        <div dir="rtl" style={{
          display: 'flex', gap: 6,
          padding: '8px var(--sp-3)',
          alignItems: 'center',
          overflowX: 'auto', overflowY: 'hidden',
          scrollbarWidth: 'none',
          background: 'var(--bg)',
          borderBottom: '1px solid var(--border)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
        }}>
          {chips.map(c => (
            <div key={c.key} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 4px 4px 10px', height: 28,
              background: 'var(--card)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--r-md)',
              color: 'var(--accent)', fontSize: 11.5, fontWeight: 700,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              <span style={{
                opacity: 0.65, fontWeight: 600, fontSize: 10.5,
              }}>{c.label}</span>
              <span style={{ opacity: 0.3 }}>·</span>
              <span>{c.text}</span>
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

      <Sheet open={openFilters} onClose={() => setOpenFilters(false)} title="فیلترها" noScroll>
        {/* پیش‌نمایش زنده فیلترهای فعال */}
        {chips.length > 0 && (
          <div style={{
            display: 'flex', gap: 4, flexWrap: 'wrap',
            padding: '6px 8px', marginBottom: 6,
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
          }}>
            {chips.map(c => (
              <button key={c.key} type="button"
                onClick={() => clearFilter(c.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  padding: '3px 6px 3px 8px',
                  background: 'var(--card-solid, #fff)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--accent)', fontSize: 10.5, fontWeight: 700,
                  fontFamily: 'inherit', cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>
                {c.icon && <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  fontSize: typeof c.icon === 'string' ? 12 : undefined,
                }}>{c.icon}</span>}
                <span>{c.text}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 14, height: 14,
                  background: 'var(--accent)', color: 'var(--avatar-text)',
                  borderRadius: '50%', fontSize: 9, fontWeight: 800,
                }}>✕</span>
              </button>
            ))}
          </div>
        )}

        {/* گروه‌های آکاردئونی */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filterDefs.map((def, idx) => {
            const cnt = countActiveInGroup(def);
            return (
              <div key={def.key} style={{
                borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
              }}>
                {/* تیتر گروه */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 4px',
                }}>
                  {def.icon && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: typeof def.icon === 'string' ? 16 : undefined,
                      color: cnt > 0 ? 'var(--accent)' : 'var(--muted)',
                    }}>{def.icon}</span>
                  )}
                  <span style={{
                    flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700,
                    color: cnt > 0 ? 'var(--accent)' : 'var(--text)',
                  }}>{def.label}</span>
                  {cnt > 0 && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      minWidth: 18, height: 18, padding: '0 5px',
                      background: 'var(--accent)', color: 'var(--avatar-text)',
                      borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-2xs)', fontWeight: 800,
                    }}>{cnt}</span>
                  )}
                </div>
                {/* محتوا — همیشه باز */}
                <div style={{ paddingBottom: 10, paddingTop: 2 }}>
                  <FilterGroupBody def={def} value={filterState[def.key]} setFilter={setFilter} clearFilter={clearFilter} filterState={filterState} />
                </div>
              </div>
            );
          })}
        </div>
        {/* دکمه‌های پایین — sticky */}
        <div style={{
          display: 'flex', gap: 8,
          paddingTop: 12,
          paddingBottom: 4,
          borderTop: '1px solid var(--border)',
          marginTop: 8,
          position: 'sticky',
          bottom: 0,
          background: 'var(--card-solid, #fff)',
          zIndex: 10,
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

      {/* ═══ Sheet گروه‌بندی ═══ */}
      {setGroupBy && (
        <Sheet open={openGroup} onClose={() => setOpenGroup(false)} title="گروه‌بندی">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { val: 'none', label: 'بدون گروه‌بندی' },
              { val: 'partyId', label: 'طرف حساب' },
              { val: 'date', label: 'تاریخ' },
              { val: 'category', label: 'دسته کالا' },
              { val: 'workflow', label: 'وضعیت پرداخت' }
            ].map(opt => (
              <button key={opt.val} type="button" 
                onClick={() => { setGroupBy(opt.val); setOpenGroup(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  width: '100%', padding: '8px 10px', minHeight: 42,
                  background: groupBy === opt.val ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                  border: '1px solid ' + (groupBy === opt.val ? 'var(--accent-border)' : 'var(--border)'),
                  borderRadius: 'var(--r-lg)', color: 'var(--text)', fontFamily: 'inherit', cursor: 'pointer',
                  textAlign: 'right', transition: 'all var(--dur-fast) var(--ease-out)',
                }}>
                <div style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700, color: groupBy === opt.val ? 'var(--accent)' : 'var(--text)' }}>
                  {opt.label}
                </div>
                {groupBy === opt.val && <IconCheck size={16} color="var(--accent)" />}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* ═══ Sheet مرتب‌سازی ═══ */}
      <Sheet open={openSort} onClose={() => setOpenSort(false)} title="مرتب‌سازی">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sortDefs.map(def => {
            const stackIdx = sortStack.findIndex(s => s.key === def.key);
            const isActive = stackIdx !== -1;
            const isPrimary = sortStack[0]?.key === def.key;
            const dir = isActive ? sortStack[stackIdx].dir : 'asc';
            const levelLabel = isActive && sortStack.length > 1 ? toFa(stackIdx + 1) : '';
            
            return (
              <div key={def.key} style={{ position: 'relative' }}>
                <button type="button" onClick={() => toggleSort(def.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                    width: '100%', padding: '8px 10px', minHeight: 42,
                    background: isActive ? 'var(--accent-soft)' : 'var(--card-solid, #fff)',
                    border: '1px solid ' + (isActive ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 'var(--r-lg)',
                    color: 'var(--text)',
                    fontFamily: 'inherit', cursor: 'pointer',
                    textAlign: 'right',
                    transition: 'all var(--dur-fast) var(--ease-out)',
                  }}>
                  {def.icon && (
                    <span style={{
                      width: 30, height: 30, borderRadius: 'var(--r-md)',
                      background: isActive ? 'var(--accent)' : 'var(--input-bg)',
                      color: isActive ? 'var(--avatar-text)' : 'var(--muted)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>{def.icon}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--fs-base)', fontWeight: 700,
                      color: isActive ? 'var(--accent)' : 'var(--text)',
                      lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: 6
                    }}>
                      {def.label}
                      {levelLabel && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 18, height: 18, padding: '0 5px',
                          background: 'var(--accent)', color: 'var(--avatar-text)',
                          borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-2xs)', fontWeight: 800,
                        }}>{levelLabel}</span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 10.5, color: 'var(--muted)',
                      marginTop: 2, fontWeight: 500,
                    }}>
                      {isActive
                        ? (dir === 'asc' ? 'صعودی — از کوچک به بزرگ' : 'نزولی — از بزرگ به کوچک')
                        : (def.hint || 'برای مرتب‌سازی لمس کن')}
                    </div>
                  </div>
                </button>
                {isPrimary && appendSort && (
                  <button type="button" onClick={(e) => { e.stopPropagation(); appendSort(def.key); }}
                    title="افزودن به عنوان معیار بعدی"
                    style={{
                      position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--accent)', color: 'var(--avatar-text)',
                      border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, cursor: 'pointer', zIndex: 2,
                    }}>+</button>
                )}
              </div>
            );
          })}

        </div>
      </Sheet>
    </>
  );
}
