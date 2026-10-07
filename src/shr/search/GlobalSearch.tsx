import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from './useGlobalSearch';
import { SOURCES } from './config';

interface Props { open: boolean; onClose: () => void; }

const INITIAL_LIMIT = 10;

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const groups = useGlobalSearch(query);

  const placeholders = [
    'گله‌ها رو جستجو کن...',
    'سالن، مخاطب، انبار...',
    'کالا، فاکتور، واکسن...',
    'جوجه‌کشی، تخم‌مرغ...',
  ];
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setPlaceholderIdx(i => (i + 1) % placeholders.length), 3200);
    return () => clearInterval(t);
  }, [open]);

  const scopedGroups = useMemo(() => {
    if (scope === 'all') return groups;
    return groups.filter(g => g.source.id === scope);
  }, [groups, scope]);

  const totalHits = useMemo(
    () => scopedGroups.reduce((s, g) => s + g.hits.length, 0),
    [scopedGroups]
  );

  const availableScopes = useMemo(() => {
    const ids = new Set(groups.map(g => g.source.id));
    return SOURCES.filter(s => ids.has(s.id));
  }, [groups]);

  useEffect(() => {
    if (open) {
      setQuery(''); setScope('all'); setExpanded({});
      const t1 = setTimeout(() => setMounted(true), 10);
      const t2 = setTimeout(() => inputRef.current?.focus(), 120);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else setMounted(false);
  }, [open]);

  if (!open) return null;

  const isEmpty = query.trim().length < 2;

  const close = () => {
    setMounted(false);
    setTimeout(onClose, 140);
  };

  const go = (route: string) => {
    setMounted(false);
    setTimeout(() => { nav(route); onClose(); }, 140);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  return (
    <>
      <style>{`
        @keyframes gsOverlayIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes gsOverlayOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes gsPanelIn {
          from { opacity: 0; transform: translateY(-6px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }
        @keyframes gsPanelOut {
          from { opacity: 1; transform: translateY(0)    scale(1);   }
          to   { opacity: 0; transform: translateY(-6px) scale(.97); }
        }
        @keyframes gsRowIn {
          from { opacity: 0; transform: translateY(-2px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gsFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* بک‌دراپ — تقریباً نامرئی */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,.03)',
          backdropFilter: 'blur(0.5px)',
          WebkitBackdropFilter: 'blur(0.5px)',
          zIndex: 199,
          animation: mounted ? 'gsOverlayIn .18s ease-out both' : 'gsOverlayOut .14s ease-in both',
        }}
      />

      {/* پنل */}
      <div style={{
        position: 'fixed',
        top: 56, left: 8, right: 8,
        zIndex: 200,
        background: 'var(--card-solid, var(--card))',
        backgroundImage: 'linear-gradient(var(--card-solid, var(--card)), var(--card-solid, var(--card)))',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 12px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.05)',
        maxHeight: isEmpty ? 'auto' : '58vh',
        isolation: 'isolate',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: mounted
          ? 'gsPanelIn .24s cubic-bezier(.32,.72,0,1) both'
          : 'gsPanelOut .14s ease-in both',
        transformOrigin: 'calc(100% - 42px) -6px',
        direction: 'rtl',
      }}>
        {/* نوار ورودی */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          borderBottom: '1px solid ' + (focused ? 'var(--accent)' : 'var(--border)'),
          boxShadow: focused ? 'inset 0 -2px 0 0 var(--accent-soft)' : 'none',
          transition: 'border-color .2s ease, box-shadow .2s ease',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 8,
            background: focused ? 'var(--accent-soft)' : 'transparent',
            transition: 'background .2s ease',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke={focused ? 'var(--accent)' : 'var(--muted)'}
                 strokeWidth="2.4" strokeLinecap="round"
                 style={{ transition: 'stroke .2s ease' }}>
              <circle cx="11" cy="11" r="7.5" /><path d="m21 21-4-4" />
            </svg>
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholders[placeholderIdx]}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontFamily: 'inherit',
              fontSize: 14, fontWeight: 500,
              minWidth: 0, padding: 0,
              textAlign: 'right', direction: 'rtl',
            }}
          />
          {!isEmpty ? (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              aria-label="پاک کردن"
              style={{
                width: 24, height: 24, borderRadius: 12, border: 'none',
                background: 'var(--btn-bg)', color: 'var(--muted)',
                cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'gsFadeUp .2s ease both',
              }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div style={{
              fontSize: 10.5, color: 'var(--muted)', fontWeight: 600,
              padding: '3px 8px', borderRadius: 100,
              background: 'var(--btn-bg)',
              letterSpacing: '.3px',
            }}>Ctrl+K</div>
          )}
        </div>

        {/* نوار scope */}
        {!isEmpty && availableScopes.length > 1 && (
          <div style={{
            display: 'flex', gap: 6, padding: '7px 12px',
            overflowX: 'auto', flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            scrollbarWidth: 'none',
            position: 'relative',
            maskImage: 'linear-gradient(to left, #000 0, #000 calc(100% - 24px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to left, #000 0, #000 calc(100% - 24px), transparent 100%)',
          }}>
            <ScopeChip
              active={scope === 'all'}
              onClick={() => setScope('all')}
              label={'همه'}
              count={groups.reduce((s, g) => s + g.hits.length, 0)}
            />
            {availableScopes.map(s => {
              const g = groups.find(x => x.source.id === s.id);
              if (!g) return null;
              return (
                <ScopeChip
                  key={s.id}
                  active={scope === s.id}
                  onClick={() => setScope(s.id)}
                  label={s.label}
                  icon={s.icon}
                  count={g.hits.length}
                />
              );
            })}
          </div>
        )}

        {/* نتایج */}
        <div style={{ overflowY: 'auto', flex: 1, direction: 'rtl' }}>
          {isEmpty ? (
            <EmptyState />
          ) : totalHits === 0 ? (
            <NoResults query={query} />
          ) : (
            <>
              <div style={{
                padding: '6px 14px 2px',
                fontSize: 11.5, color: 'var(--accent)', fontWeight: 700,
                letterSpacing: '.3px',
                display: 'flex', alignItems: 'center', gap: 6,
                justifyContent: 'flex-end', direction: 'rtl',
              }}>
                <span style={{
                  display: 'inline-block', width: 6, height: 6,
                  borderRadius: '50%', background: 'var(--accent)',
                }} />
                <span>{totalHits} نتیجه</span>
              </div>
              {scopedGroups.map(g => {
                const isExpanded = !!expanded[g.source.id];
                const visible = isExpanded ? g.hits : g.hits.slice(0, INITIAL_LIMIT);
                const remaining = g.hits.length - visible.length;

                return (
                  <div key={g.source.id} style={{ marginBottom: 4 }}>
                    {scope === 'all' && (
                      <div style={{
                        padding: '9px 14px 5px',
                        fontSize: 13.5, color: 'var(--text)',
                        fontWeight: 800, display: 'flex',
                        alignItems: 'center', gap: 7,
                        letterSpacing: '.2px',
                        borderTop: '1px solid var(--border)',
                        marginTop: 4, textAlign: 'right', direction: 'rtl',
                      }}>
                        <span style={{ fontSize: 16 }}>{g.source.icon}</span>
                        <span>{g.source.label}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: 'var(--accent)',
                          background: 'var(--accent-soft)',
                          borderRadius: 8, padding: '1px 7px',
                          marginRight: 'auto', marginLeft: 0,
                        }}>{g.hits.length}</span>
                      </div>
                    )}
                    {visible.map((h) => (
                      <button
                        key={g.source.id + h.id}
                        onClick={() => go(g.source.route)}
                        style={{
                          width: '100%', textAlign: 'right',
                          display: 'block',
                          padding: '5px 14px',
                          background: 'transparent',
                          border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', color: 'var(--text)',
                          direction: 'rtl',
                        }}
                        onTouchStart={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                        onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-soft)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          fontSize: 13, fontWeight: 600,
                          color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          lineHeight: 1.4, textAlign: 'right', direction: 'rtl',
                        }}>{h.title}</div>
                        {h.sub && (
                          <div style={{
                            fontSize: 11, color: 'var(--muted)',
                            marginTop: 1, fontWeight: 500,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            lineHeight: 1.4,
                            textAlign: 'right', direction: 'rtl',
                          }}>{h.sub}</div>
                        )}
                      </button>
                    ))}
                    {remaining > 0 && (
                      <button
                        onClick={() => setExpanded(p => ({ ...p, [g.source.id]: true }))}
                        style={{
                          width: '100%', textAlign: 'center',
                          padding: '10px 16px', background: 'transparent',
                          border: 'none', cursor: 'pointer',
                          color: 'var(--accent)',
                          fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                        }}
                      >
                        نمایش {remaining} مورد بیشتر
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ===== زیرکامپوننت‌ها =====


function ScopeChip({ active, onClick, label, icon, count }: {
  active: boolean; onClick: () => void; label: string; icon?: string; count: number;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 11px',
        borderRadius: 100,
        border: '1px solid ' + (active ? 'transparent' : 'var(--border)'),
        background: active
          ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent) 100%)'
          : 'var(--btn-bg)',
        color: active ? '#fff' : 'var(--muted)',
        fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
        cursor: 'pointer',
        transition: 'all .22s cubic-bezier(.32,.72,0,1)',
        whiteSpace: 'nowrap',
        boxShadow: active ? '0 3px 10px rgba(0,0,0,.10)' : 'none',
      }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      <span>{label}</span>
      <span style={{
        fontSize: 10.5, opacity: .9, fontWeight: 700,
        background: active ? 'rgba(255,255,255,.25)' : 'var(--card-solid, var(--card))',
        borderRadius: 8, padding: '1px 6px', minWidth: 18,
        textAlign: 'center',
      }}>{count}</span>
    </button>
  );
}

function EmptyState() {
  return (
    <div style={{
      padding: '22px 16px', textAlign: 'center',
      color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.8,
      animation: 'gsFadeUp .3s ease both',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: 'var(--accent-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px', fontSize: 22,
      }}>🔍</div>
      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontSize: 15 }}>
        چی رو جستجو کنم؟
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.9 }}>
        نام گله، سالن، مخاطب، کالا،<br />فاکتور، واکسن و ...
      </div>
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div style={{
      padding: '22px 16px', textAlign: 'center',
      color: 'var(--muted)', fontSize: 12.5, lineHeight: 1.8,
      animation: 'gsFadeUp .3s ease both',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14,
        background: 'var(--btn-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px', fontSize: 22,
      }}>🤔</div>
      <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4, fontSize: 15 }}>
        چیزی برای «{query}» پیدا نشد
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.9 }}>
        املا رو چک کن یا کلمه‌ی کوتاه‌تری امتحان کن
      </div>
    </div>
  );
}
