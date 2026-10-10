/** HallEquipSection — تجهیزات سالن (بازطراحی تک‌خطی) */
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import HallEquipModals from './components/HallEquipModals';
import { CategoryIcon, CATEGORY_COLORS } from '../../shr/icons/equipment';
import {
  useHal,
  CATEGORY_LABELS,
  type Equipment,
} from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { NEED_CALCULATORS, type NeedInput } from './needs';
import {
  typesForCategory, unitForCategory, calcInstalled,
  ALL_CATS,
} from './_equipHelpers';
import { getEquipUnit } from './equipUnits';

interface Props {
  hallId: string;
  needInput?: NeedInput;
  legacy?: {
    ventilationSystem?: string;
    feederType?: string;
    drinkerType?: string;
    litterType?: string;
  };
}

type Tone = 'ok' | 'low' | 'very-low' | 'over' | 'none';

const TONE_COLOR: Record<Tone, string> = {
  'ok': 'var(--accent)',
  'low': 'var(--warn)',
  'very-low': 'var(--danger)',
  'over': 'var(--purple)',
  'none': 'var(--dim)',
};
const TONE_EMOJI: Record<Tone, string> = {
  'ok': '🟢',
  'low': '🟡',
  'very-low': '🔴',
  'over': '🟣',
  'none': '⚪',
};
const TONE_LABEL: Record<Tone, string> = {
  'ok': 'کافی',
  'low': 'کم',
  'very-low': 'خیلی کم',
  'over': 'اضافه',
  'none': 'ثبت نشده',
};

export function HallEquipSection({ hallId, needInput, legacy }: Props) {
  const { equipment, addEquip, updateEquip, deleteEquip } = useHal();

  const [open, setOpen] = useState(false);
  const [detailCat, setDetailCat] = useState<string | null>(null);
  const [catPicker, setCatPicker] = useState(false);

  // Picker state
  const [picker, setPicker] = useState(false);
  const [pickerCat, setPickerCat] = useState<string>('ventilation');
  const [pickerType, setPickerType] = useState<string>('fan_tunnel');
  const [pickerCount, setPickerCount] = useState<string>('');
  const [pickerCap, setPickerCap] = useState<string>('');
  const [pickerName, setPickerName] = useState<string>('');

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  const [editCap, setEditCap] = useState<string>('');

  // 🆕 قفل کامل scroll بدن وقتی هر modal بازه
  useEffect(() => {
    const anyOpen = catPicker || picker || detailCat !== null || editId !== null;
    if (!anyOpen) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevTouch = body.style.touchAction;
    const prevPos = body.style.position;
    const prevTop = body.style.top;
    const scrollY = window.scrollY;
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.overflow = prevOverflow;
      body.style.touchAction = prevTouch;
      body.style.position = prevPos;
      body.style.top = prevTop;
      body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [catPicker, picker, detailCat, editId]);

  // ═══ محاسبات ═══
  const hallEquips = useMemo(
    () => equipment.filter(e => e.hallId === hallId),
    [equipment, hallId],
  );

  const grouped = useMemo(() => {
    const g: Record<string, Equipment[]> = {};
    hallEquips.forEach(e => {
      const cat = (e as any).category || 'auxiliary';
      if (!g[cat]) g[cat] = [];
      g[cat].push(e);
    });
    return g;
  }, [hallEquips]);

  const needByCategory = useMemo(() => {
    const m: Record<string, { value: number; unit: string } | null> = {};
    if (needInput) {
      Object.entries(NEED_CALCULATORS).forEach(([cat, calc]) => {
        try { m[cat] = calc(needInput); } catch { m[cat] = null; }
      });
    }
    return m;
  }, [needInput]);

  function toneFor(cat: string): Tone {
    const installed = calcInstalled(cat, grouped[cat] || []);
    const need = needByCategory[cat]?.value || 0;
    if (installed === 0 && need === 0) return 'none';
    if (installed === 0 && need > 0) return 'very-low';
    if (need === 0) return 'ok';
    const pct = (installed / need) * 100;
    if (pct < 50) return 'very-low';
    if (pct < 90) return 'low';
    if (pct <= 150) return 'ok';
    return 'over';
  }

  function pctFor(cat: string): number | null {
    const installed = calcInstalled(cat, grouped[cat] || []);
    const need = needByCategory[cat]?.value || 0;
    if (installed === 0 || need === 0) return null;
    return (installed / need) * 100;
  }

  // ═══ دسته‌های قابل نمایش (فقط اونایی که تجهیز دارن یا نیاز دارن) ═══
  const displayCats = useMemo(() => {
    return ALL_CATS.filter(cat => {
      const hasItems = (grouped[cat] || []).length > 0;
      const hasNeed = (needByCategory[cat]?.value || 0) > 0;
      return hasItems || hasNeed;
    });
  }, [grouped, needByCategory]);

  const issueCount = useMemo(() => {
    return displayCats.filter(cat => {
      const t = toneFor(cat);
      return t === 'very-low' || t === 'low';
    }).length;
  }, [displayCats, grouped, needByCategory]);

  const headerDots = useMemo(() => {
    return displayCats.map(cat => toneFor(cat)).slice(0, 5);
  }, [displayCats, grouped, needByCategory]);

  // ═══ Handlers ═══
  const openPicker = (cat: string) => {
    setCatPicker(false);  // 🆕
    setDetailCat(null);   // 🆕
    const types = typesForCategory(cat);
    setPickerCat(cat);
    setPickerType(types[0] || 'other');
    setPickerCount('');
    setPickerCap('');
    setPickerName('');
    setPicker(true);
  };

  const saveNewEquip = () => {
    if (!pickerName.trim()) { toastMsg.error('نام تجهیز اجباری است'); return; }
    const name = pickerName.trim();
    const dup = hallEquips.find((x: any) => x.type === pickerType && x.name.trim() === name);
    if (dup) { toastMsg.error('این تجهیز قبلاً در همین سالن ثبت شده'); return; }
    const def = getEquipUnit(pickerType);
    const capValue = pickerCap
      ? parseFloat(toEn(pickerCap).replace('٫', '.')) || null
      : (def.secondary?.defaultValue || null);
    addEquip({
      hallId,
      category: pickerCat as any,
      type: pickerType,
      name,
      count: pickerCount ? parseInt(toEn(pickerCount)) || null : null,
      unit: 'pcs',
      unitPrice: null,
      purchasedAt: '',
      warranty: null,
      notes: '',
      capacity: capValue,
      efficiency: null,
      consumeRate: undefined,
      createdAt: '',
      updatedAt: '',
    } as any);
    toastMsg.added(name);
    setPicker(false);
  };

  const openEdit = (e: Equipment) => {
    setEditId(e.id);
    setEditCount(e.count ? toFa(e.count) : '');
    setEditCap((e as any).capacity ? toFa((e as any).capacity) : '');
  };

  const saveEdit = () => {
    if (!editId) return;
    const cur = hallEquips.find(x => x.id === editId);
    if (!cur) return;
    const newCount = editCount ? parseInt(toEn(editCount)) || null : null;
    const newCap = editCap ? parseFloat(toEn(editCap).replace('٫', '.')) || null : null;
    updateEquip(editId, { count: newCount, capacity: newCap } as any);
    toastMsg.saved(cur.name);
    setEditId(null);
  };

  const removeEquip = async (id: string, name: string) => {
    const ok = await showConfirmAsync('حذف تجهیز', '«' + name + '» از این سالن حذف شود؟', { danger: true });
    if (!ok) return;
    deleteEquip(id);
    toastMsg.deleted(name);
    setDetailCat(null);
  };

  // 🆕 Escape key
  useEffect(() => {
    if (!catPicker) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCatPicker(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [catPicker]);

  // ═══ Detail modal data ═══
  const detailList = detailCat ? (grouped[detailCat] || []) : [];
  const detailCatLabel = detailCat ? ((CATEGORY_LABELS as any)[detailCat]?.name || detailCat) : '';
  const detailColor = detailCat ? (CATEGORY_COLORS[detailCat] || 'var(--cat-auxiliary)') : 'var(--cat-auxiliary)';
  const detailInstalled = detailCat ? calcInstalled(detailCat, detailList) : 0;
  const detailNeed = detailCat ? (needByCategory[detailCat]?.value || 0) : 0;
  const detailNeedUnit = detailCat ? (needByCategory[detailCat]?.unit || unitForCategory(detailCat, detailList)) : '';
  const detailUnit = detailCat ? unitForCategory(detailCat, detailList) : '';
  const currentEdit = editId ? hallEquips.find(e => e.id === editId) : null;

  return (
    <>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {/* ═══ هدر ═══ */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            width: '100%', padding: '10px 12px',
            background: 'var(--bg)', border: 'none',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right',
          }}
        >
          <span style={{ fontSize: 14 }}>⚙️</span>
          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
            تجهیزات سالن
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px',
            borderRadius: 6, background: 'var(--card-solid)', color: 'var(--muted)',
          }}>{toFa(hallEquips.length)} مورد</span>
          <div style={{ display: 'flex', gap: 4, marginRight: 'auto' }}>
            {headerDots.map((t, i) => (
              <span key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: TONE_COLOR[t],
              }} />
            ))}
          </div>
          <span style={{
            color: 'var(--muted)', fontSize: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .25s',
          }}>▾</span>
        </button>

        {/* ═══ خلاصه (بسته) ═══ */}
        {!open && (
          <div style={{
            padding: '0 12px 10px', background: 'var(--bg)',
            fontSize: 'var(--fs-sm)', color: 'var(--muted)',
          }}>
            {issueCount > 0 ? (
              <>
                ⚠️ <span style={{ fontWeight: 700, color: 'var(--warn)' }}>
                  {toFa(issueCount)} دسته
                </span>{' '}
                نیاز به توجه داره
              </>
            ) : displayCats.length > 0 ? (
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓ همه تجهیزات کافی هستن</span>
            ) : (
              <span style={{ color: 'var(--muted)' }}>تجهیزی ثبت نشده</span>
            )}
          </div>
        )}

        {/* ═══ محتوای باز — تک‌خطی ═══ */}
        {open && (
          <div>
            {displayCats.length === 0 ? (
              <div style={{
                padding: 20, textAlign: 'center',
                fontSize: 'var(--fs-sm)', color: 'var(--muted)',
                background: 'var(--card-solid)',
              }}>
                تجهیزی ثبت نشده — با دکمه پایین اضافه کن
              </div>
            ) : (
              displayCats.map(cat => {
                const list = grouped[cat] || [];
                const tone = toneFor(cat);
                const pct = pctFor(cat);
                const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
                const color = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
                const soft = (CATEGORY_COLORS as any)[cat + '-soft'] || 'var(--input-bg)';
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDetailCat(cat)}
                    style={{
                      width: '100%', padding: '10px 12px', minHeight: 46,
                      background: 'var(--card-solid)',
                      border: 'none', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 10,
                      fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right',
                    }}
                  >
                    <span style={{
                      width: 30, height: 30, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: soft, color, flexShrink: 0,
                    }}>
                      <CategoryIcon category={cat} size={16} weight="duotone" color={color} />
                    </span>
                    <span style={{
                      fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)',
                      flexShrink: 0, minWidth: 62,
                    }}>{label}</span>
                    <div style={{
                      flex: 1, height: 5, borderRadius: 3,
                      background: 'var(--border)', overflow: 'hidden',
                      minWidth: 40,
                    }}>
                      <div style={{
                        width: `${Math.min(pct || 0, 100)}%`, height: '100%',
                        background: TONE_COLOR[tone], borderRadius: 3,
                      }} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: TONE_COLOR[tone],
                      minWidth: 40, textAlign: 'left', flexShrink: 0,
                    }}>
                      {pct !== null ? `${toFa(Math.round(pct))}٪` : '—'}
                    </span>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{TONE_EMOJI[tone]}</span>
                  </button>
                );
              })
            )}

            <div style={{ padding: 10, background: 'var(--card-solid)' }}>
              <button
                type="button"
                onClick={() => setCatPicker(true)}
                style={{
                  width: '100%', padding: 10, minHeight: 40,
                  borderRadius: 8, border: '1px dashed var(--accent-border)',
                  background: 'var(--accent-soft)', color: 'var(--accent)',
                  fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  fontWeight: 700, cursor: 'pointer',
                }}
              >+ افزودن دسته‌ی تجهیز</button>
            </div>

            {/* legacy pills */}
            {legacy && (legacy.ventilationSystem || legacy.feederType || legacy.drinkerType || legacy.litterType) && (
              <div style={{
                padding: '0 12px 10px',
                background: 'var(--card-solid)',
                display: 'flex', flexWrap: 'wrap', gap: 4,
              }}>
                {legacy.ventilationSystem && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>تهویه: {legacy.ventilationSystem}</span>}
                {legacy.feederType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>دان: {legacy.feederType}</span>}
                {legacy.drinkerType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>آب: {legacy.drinkerType}</span>}
                {legacy.litterType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>بستر: {legacy.litterType}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Category Picker (Portal) ═══ */}
      {catPicker && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="افزودن دسته تجهیز"
          data-sheet-open="true"
          onClick={() => setCatPicker(false)}
          onPointerDownCapture={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onTouchStartCapture={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchMoveCapture={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'var(--overlay)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            touchAction: 'none',
            overscrollBehavior: 'contain',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--card-solid)',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              width: '100%', maxWidth: 540, maxHeight: '70vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border)' }} />
            </div>
            <div style={{
              padding: '8px 14px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>افزودن دسته تجهیز</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  کدام دسته؟
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCatPicker(false)}
                aria-label="بستن"
                style={{
                  width: 40, height: 40, borderRadius: 10,
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--muted)', fontSize: 14, cursor: 'pointer',
                }}
              >✕</button>
            </div>
            <div
              onPointerDownCapture={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
              onTouchStartCapture={e => e.stopPropagation()}
              onTouchStart={e => e.stopPropagation()}
              onTouchMoveCapture={e => e.stopPropagation()}
              onTouchMove={e => e.stopPropagation()}
              style={{
                padding: 10, overflowY: 'auto', flex: 1,
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                touchAction: 'pan-y',
              }}>
              {ALL_CATS.map(cat => {
                const color = (CATEGORY_COLORS as any)[cat] || 'var(--cat-auxiliary)';
                const soft = (CATEGORY_COLORS as any)[cat + '-soft'] || 'var(--input-bg)';
                const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
                const count = (grouped[cat] || []).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => openPicker(cat)}
                    style={{
                      width: '100%', padding: '10px 12px', minHeight: 52,
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 12,
                      fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right',
                    }}
                  >
                    <span style={{
                      width: 34, height: 34, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: soft, color,
                    }}>
                      <CategoryIcon category={cat} size={18} weight="duotone" color={color} />
                    </span>
                    <span style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                    {count > 0 && (
                      <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>{toFa(count)} مورد</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      <HallEquipModals
        detailCat={detailCat} setDetailCat={setDetailCat}
        detailCatLabel={detailCatLabel} detailInstalled={detailInstalled}
        detailNeed={detailNeed} detailUnit={detailUnit} detailNeedUnit={detailNeedUnit}
        detailList={detailList} detailColor={detailColor}
        openPicker={openPicker} openEdit={openEdit} removeEquip={removeEquip}
        picker={picker} setPicker={setPicker} pickerCat={pickerCat}
        pickerType={pickerType} setPickerType={setPickerType}
        pickerName={pickerName} setPickerName={setPickerName}
        pickerCount={pickerCount} setPickerCount={setPickerCount}
        pickerCap={pickerCap} setPickerCap={setPickerCap}
        saveNewEquip={saveNewEquip} typesForCategory={typesForCategory}
        equipment={equipment}
        editId={editId} setEditId={setEditId} currentEdit={currentEdit}
        editCount={editCount} setEditCount={setEditCount}
        editCap={editCap} setEditCap={setEditCap}
        saveEdit={saveEdit}
      />
    </>
  );
}
