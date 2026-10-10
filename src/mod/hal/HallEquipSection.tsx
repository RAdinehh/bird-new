/** HallEquipSection — تجهیزات سالن + نیاز گله (بازطراحی فشرده) */
import { useState, useMemo } from 'react';
import HallEquipModals from './components/HallEquipModals';
import { CategoryIcon, CATEGORY_COLORS } from '../../shr/icons/equipment';
import {
  useHal,
  CATEGORY_LABELS,
  EQUIP_LABELS,
  type Equipment,
} from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { NEED_CALCULATORS, type NeedInput } from './needs';
import {
  typesForCategory, unitForCategory, calcInstalled,
  REQUIRED_CATS, OPTIONAL_CATS, ALL_CATS,
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
const TONE_LABEL: Record<Tone, string> = {
  'ok': '🟢 کافی',
  'low': '🟡 کم',
  'very-low': '🔴 خیلی کم',
  'over': '🟠 اضافه',
  'none': '— ثبت نشده',
};

export function HallEquipSection({ hallId, needInput, legacy }: Props) {
  const { equipment, addEquip, updateEquip, deleteEquip } = useHal();

  // ═══ حالت باز/بسته ═══
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // ═══ Picker state ═══
  const [picker, setPicker] = useState(false);
  const [pickerCat, setPickerCat] = useState<string>('ventilation');
  const [pickerType, setPickerType] = useState<string>('fan_tunnel');
  const [pickerCount, setPickerCount] = useState<string>('');
  const [pickerCap, setPickerCap] = useState<string>('');
  const [pickerName, setPickerName] = useState<string>('');

  // ═══ Edit state ═══
  const [editId, setEditId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  const [editCap, setEditCap] = useState<string>('');

  // ═══ Detail modal ═══
  const [detailCat, setDetailCat] = useState<string | null>(null);

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
    if (installed === 0) return 'none';
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

  // ═══ دسته‌بندی: ناقص/کامل ═══
  const { incompleteCats, completeCats, issueCount } = useMemo(() => {
    const incomplete: string[] = [];
    const complete: string[] = [];
    ALL_CATS.forEach(cat => {
      const list = grouped[cat] || [];
      const tone = toneFor(cat);
      if (list.length === 0 && needByCategory[cat]?.value) {
        incomplete.push(cat);
      } else if (list.length === 0) {
        // بدون نصب بدون نیاز — نادیده
      } else if (tone === 'very-low' || tone === 'low') {
        incomplete.push(cat);
      } else {
        complete.push(cat);
      }
    });
    return { incompleteCats: incomplete, completeCats: complete, issueCount: incomplete.length };
  }, [grouped, needByCategory]);

  // ═══ Handlers ═══
  const openPicker = (cat: string) => {
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
      hallId, kind: 'asset', category: pickerCat as any,
      type: pickerType, name,
      count: pickerCount ? parseInt(toEn(pickerCount)) || null : null,
      unit: 'pcs', unitPrice: null, purchasedAt: '',
      warranty: null, notes: '',
      capacity: capValue, efficiency: null,
      consumeRate: undefined,
      createdAt: '', updatedAt: '',
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

  // ═══ Detail modal data ═══
  const detailList = detailCat ? (grouped[detailCat] || []) : [];
  const detailCatLabel = detailCat ? ((CATEGORY_LABELS as any)[detailCat]?.name || detailCat) : '';
  const detailColor = detailCat ? (CATEGORY_COLORS[detailCat] || 'var(--cat-auxiliary)') : 'var(--cat-auxiliary)';
  const detailInstalled = detailCat ? calcInstalled(detailCat, detailList) : 0;
  const detailNeed = detailCat ? (needByCategory[detailCat]?.value || 0) : 0;
  const detailNeedUnit = detailCat ? (needByCategory[detailCat]?.unit || unitForCategory(detailCat, detailList)) : '';
  const detailUnit = detailCat ? unitForCategory(detailCat, detailList) : '';
  const currentEdit = editId ? hallEquips.find(e => e.id === editId) : null;

  // ═══ نمایش دسته‌ها ═══
  const displayCats = showAll ? [...incompleteCats, ...completeCats] : incompleteCats;

  // ═══ هدر: آیکون‌های وضعیت (۴ تا ۶ تا) ═══
  const headerCats = ALL_CATS.filter(c => (grouped[c] || []).length > 0 || needByCategory[c]?.value).slice(0, 6);

  return (
    <>
      <div style={{
        background: 'var(--bg)', borderRadius: 10, overflow: 'hidden',
        border: issueCount > 0 && !open ? '1px solid rgba(234,88,12,.25)' : '1px solid transparent',
      }}>
        {/* ═══ هدر (کلیک‌پذیر) ═══ */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          style={{
            width: '100%', padding: '10px 12px',
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'inherit', cursor: 'pointer',
            textAlign: 'right',
          }}
        >
          <span style={{ fontSize: 14 }}>⚙️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>تجهیزات سالن</span>
          <span style={{
            fontSize: 9.5, fontWeight: 600, padding: '2px 6px',
            borderRadius: 5, background: 'var(--card-solid)', color: 'var(--dim)',
          }}>{toFa(hallEquips.length)} مورد</span>

          <div style={{ display: 'flex', gap: 3, marginRight: 'auto', alignItems: 'center' }}>
            {headerCats.map(cat => {
              const tone = toneFor(cat);
              return (
                <span key={cat} style={{
                  width: 22, height: 22, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: (CATEGORY_COLORS as any)[cat + '-soft'] || 'var(--card-solid)',
                  color: CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)',
                  position: 'relative',
                }}>
                  <span style={{
                    position: 'absolute', top: -2, left: -2,
                    width: 8, height: 8, borderRadius: '50%',
                    background: TONE_COLOR[tone],
                    border: '1.5px solid var(--bg)',
                  }} />
                  <CategoryIcon category={cat} size={12} weight="duotone" color={CATEGORY_COLORS[cat]} />
                </span>
              );
            })}
          </div>

          <span style={{
            color: 'var(--muted)', fontSize: 12,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .25s',
          }}>▾</span>
        </button>

        {/* ═══ خلاصه هشدار (فقط بسته) ═══ */}
        {!open && (
          <div style={{
            padding: '0 12px 10px',
            fontSize: 10.5, color: 'var(--muted)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {issueCount > 0 ? (
              <>
                ⚠️ <span style={{ fontWeight: 700, color: 'var(--danger)' }}>
                  {toFa(issueCount)} دسته
                </span>
                نیاز به توجه داره — لمس کن
              </>
            ) : (
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>✓ همه تجهیزات کافی هستن</span>
            )}
          </div>
        )}

        {/* ═══ محتوای باز ═══ */}
        {open && (
          <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {displayCats.length === 0 ? (
              <div style={{
                padding: 16, textAlign: 'center',
                fontSize: 11, color: 'var(--muted)',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4, opacity: .5 }}>✓</div>
                همه تجهیزات کافی هستن
              </div>
            ) : (
              displayCats.map(cat => {
                const list = grouped[cat] || [];
                const tone = toneFor(cat);
                const pct = pctFor(cat);
                const installed = calcInstalled(cat, list);
                const unit = unitForCategory(cat, list);
                const need = needByCategory[cat]?.value || 0;
                const needUnit = needByCategory[cat]?.unit || unit;
                const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
                const color = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
                return (
                  <div key={cat} style={{
                    background: 'var(--card-solid)',
                    border: '1px solid var(--border)',
                    borderRadius: 8, padding: '9px 11px',
                    display: 'flex', flexDirection: 'column', gap: 7,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'var(--bg)', color,
                      }}>
                        <CategoryIcon category={cat} size={14} weight="duotone" color={color} />
                      </span>
                      <span style={{ flex: 1, fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
                      <span style={{
                        fontSize: 9.5, fontWeight: 700,
                        padding: '2px 7px', borderRadius: 5,
                        color: TONE_COLOR[tone],
                        background: tone === 'ok' ? 'var(--accent-soft)'
                          : tone === 'low' ? 'var(--warn-soft)'
                          : tone === 'very-low' ? 'var(--danger-soft)'
                          : tone === 'over' ? 'rgba(124,58,237,.11)'
                          : 'var(--bg)',
                      }}>{TONE_LABEL[tone]}</span>
                    </div>

                    {pct !== null && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: 'var(--muted)' }}>
                        <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${Math.min(pct, 100)}%`, height: '100%',
                            background: TONE_COLOR[tone], borderRadius: 3,
                          }} />
                        </div>
                        <span>{toFa(Math.round(pct))}٪</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--muted)', flexWrap: 'wrap' }}>
                      {list.length > 0 && (
                        <span>نصب: <b style={{ color: 'var(--text)' }}>{toFa(installed.toLocaleString('fa-IR'))} {unit}</b></span>
                      )}
                      {need > 0 && (
                        <span>نیاز: <b style={{ color: 'var(--text)' }}>{toFa(need.toLocaleString('fa-IR'))} {needUnit}</b></span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => openPicker(cat)}
                        style={{
                          padding: '3px 9px', minHeight: 26,
                          borderRadius: 5, border: '1px solid var(--accent-border)',
                          background: 'var(--accent-soft)', color: 'var(--accent)',
                          fontFamily: 'inherit', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        }}
                      >+ افزودن</button>
                      {list.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setDetailCat(cat)}
                          style={{
                            padding: '3px 9px', minHeight: 26,
                            borderRadius: 5, border: '1px solid var(--border)',
                            background: 'transparent', color: 'var(--muted)',
                            fontFamily: 'inherit', fontSize: 10, fontWeight: 600, cursor: 'pointer',
                          }}
                        >مشاهده</button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* دکمه‌های پایین */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {completeCats.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll(v => !v)}
                  style={{
                    flex: 1, padding: '8px', minHeight: 34,
                    borderRadius: 6, border: '1px solid var(--border)',
                    background: 'transparent', color: 'var(--muted)',
                    fontFamily: 'inherit', fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                  }}
                >{showAll ? 'فقط ناقص‌ها' : `مشاهده همه (${toFa(completeCats.length)} کافی)`}</button>
              )}
              <button
                type="button"
                onClick={() => setDetailCat('__add__')}
                style={{
                  flex: 1, padding: '8px', minHeight: 34,
                  borderRadius: 6, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--muted)',
                  fontFamily: 'inherit', fontSize: 10.5, fontWeight: 600, cursor: 'pointer',
                }}
              >+ افزودن دسته‌ی دیگه</button>
            </div>

            {/* legacy pills */}
            {legacy && (legacy.ventilationSystem || legacy.feederType || legacy.drinkerType || legacy.litterType) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {legacy.ventilationSystem && <span style={{ fontSize: 9.5, color: 'var(--muted)', padding: '2px 6px', background: 'var(--input-bg)', borderRadius: 5 }}>تهویه: {legacy.ventilationSystem}</span>}
                {legacy.feederType && <span style={{ fontSize: 9.5, color: 'var(--muted)', padding: '2px 6px', background: 'var(--input-bg)', borderRadius: 5 }}>دان: {legacy.feederType}</span>}
                {legacy.drinkerType && <span style={{ fontSize: 9.5, color: 'var(--muted)', padding: '2px 6px', background: 'var(--input-bg)', borderRadius: 5 }}>آب: {legacy.drinkerType}</span>}
                {legacy.litterType && <span style={{ fontSize: 9.5, color: 'var(--muted)', padding: '2px 6px', background: 'var(--input-bg)', borderRadius: 5 }}>بستر: {legacy.litterType}</span>}
              </div>
            )}
          </div>
        )}
      </div>

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
