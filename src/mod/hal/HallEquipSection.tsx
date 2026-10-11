/** HallEquipSection — تجهیزات سالن (بازطراحی تک‌خطی) */
import { useState, useMemo, useEffect } from 'react';
import HallEquipModals from './components/HallEquipModals';
import CategoryPicker from './components/CategoryPicker';
import HallEquipCatRow from './components/HallEquipCatRow';
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
              displayCats.map(cat => (
                <HallEquipCatRow
                  key={cat}
                  cat={cat}
                  count={(grouped[cat] || []).length}
                  tone={toneFor(cat)}
                  pct={pctFor(cat)}
                  onClick={() => setDetailCat(cat)}
                />
              ))
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

      <CategoryPicker
        open={catPicker}
        onClose={() => setCatPicker(false)}
        onPick={openPicker}
        grouped={grouped}
      />

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
