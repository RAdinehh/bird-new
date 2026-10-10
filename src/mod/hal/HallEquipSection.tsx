/** HallEquipSection — تجهیزات سالن + نیاز گله */
import { useState } from 'react';
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

export function HallEquipSection({ hallId, needInput, legacy }: Props) {
  const { equipment, addEquip, updateEquip, deleteEquip } = useHal();

  const [picker, setPicker] = useState(false);
  const [pickerCat, setPickerCat] = useState<string>('ventilation');
  const [pickerType, setPickerType] = useState<string>('fan_tunnel');
  const [pickerCount, setPickerCount] = useState<string>('');
  const [pickerCap, setPickerCap] = useState<string>('');
  const [pickerName, setPickerName] = useState<string>('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  const [editCap, setEditCap] = useState<string>('');

  const [detailCat, setDetailCat] = useState<string | null>(null);

  const hallEquips = equipment.filter(e => e.hallId === hallId);

  // گروه‌بندی
  const grouped: Record<string, Equipment[]> = {};
  hallEquips.forEach(e => {
    const cat = (e as any).category || 'auxiliary';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });

  // نیاز هر دسته
  const needByCategory: Record<string, { value: number; unit: string } | null> = {};
  if (needInput) {
    Object.entries(NEED_CALCULATORS).forEach(([cat, calc]) => {
      try { needByCategory[cat] = calc(needInput); } catch { needByCategory[cat] = null; }
    });
  }

  // محاسبه وضعیت (فقط برای دسته‌های ضروری)
  function statusFor(cat: string): { pct: number | null; tone: 'ok' | 'warn' | 'danger' | 'over' | 'none' } {
    const installed = calcInstalled(cat, grouped[cat] || []);
    const need = needByCategory[cat]?.value || 0;
    if (installed === 0) return { pct: null, tone: 'none' };
    if (need === 0) return { pct: null, tone: 'ok' };
    const pct = (installed / need) * 100;
    if (pct < 50) return { pct, tone: 'danger' };      // خیلی کم
    if (pct < 90) return { pct, tone: 'warn' };        // کم
    if (pct <= 150) return { pct, tone: 'ok' };        // خوب
    return { pct, tone: 'over' };                       // اضافه
  }

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
    if (!pickerName.trim()) {
      toastMsg.error('نام تجهیز اجباری است')
      return;
    }
    const name = pickerName.trim();
    const dup = hallEquips.find((x: any) => x.type === pickerType && x.name.trim() === name);
    if (dup) {
      toastMsg.error('این تجهیز قبلاً در همین سالن ثبت شده')
      return;
    }
    const def = getEquipUnit(pickerType);
    const capValue = pickerCap
      ? parseFloat(toEn(pickerCap).replace('٫', '.')) || null
      : (def.secondary?.defaultValue || null);
    addEquip({
      hallId,
      kind: 'asset',
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
    } as any);
    setPicker(false);
    toastMsg.added('تجهیز')
  };

  const openEdit = (e: Equipment) => {
    setEditId(e.id);
    setEditCount(e.count ? String(e.count) : '');
    setEditCap((e as any).capacity ? String((e as any).capacity) : '');
  };

  const saveEdit = () => {
    if (!editId) return;
    updateEquip(editId, {
      count: editCount ? parseInt(toEn(editCount)) || null : null,
      capacity: editCap ? parseFloat(toEn(editCap).replace('٫', '.')) || null : null,
    } as any);
    setEditId(null);
    toastMsg.saved(currentEdit?.name || 'تجهیز')
  };

  const removeEquip = async (id: string, name: string) => {
    const ok = await showConfirmAsync('حذف تجهیز', '«' + name + '» از این سالن حذف شود؟', { danger: true });
    if (!ok) return;
    deleteEquip(id);
    toastMsg.deleted(name)
  };

  const currentEdit = editId ? hallEquips.find(e => e.id === editId) : null;
  const editCategory = currentEdit ? ((currentEdit as any).category || 'auxiliary') : '';

  /** رندر یه گروه */
  const renderGroup = (cats: string[], isRequired: boolean) => {
    const totalItems = cats.reduce((a, c) => a + (grouped[c] || []).length, 0);

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '.3px',
          paddingTop: 8,
          paddingBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: '1.05em', lineHeight: 1 }}>
            {isRequired ? '🐔' : '🔧'}
          </span>
          <span>{isRequired ? 'ضروری برای پرورش' : 'اختیاری'}</span>
          {totalItems > 0 && (
            <span style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              letterSpacing: 0,
              marginRight: 'auto',
            }}>{toFa(totalItems)} مورد</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {cats.map(cat => {
            const list = grouped[cat] || [];
            const catColor = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
            const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
            const installed = calcInstalled(cat, list);
            const unit = unitForCategory(cat, list);
            const need = needByCategory[cat]?.value || 0;
            const needUnit = needByCategory[cat]?.unit || unit;
            const st = isRequired ? statusFor(cat) : { pct: null as number | null, tone: 'none' as const };
            const isEmpty = list.length === 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (isEmpty) {
                    openPicker(cat);
                  } else {
                    setDetailCat(cat);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: isEmpty ? 'transparent' : 'var(--input-bg)',
                  border: '1px solid ' + (isEmpty ? 'var(--border)' : 'transparent'),
                  borderStyle: isEmpty ? 'dashed' : 'solid',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: 'var(--card-solid)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CategoryIcon category={cat} size={16} weight="duotone" color={catColor} />
                </span>

                <span style={{
                  flex: 1,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: isEmpty ? 'var(--muted)' : 'var(--text)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                  {!isEmpty && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 11, marginRight: 4 }}>· {toFa(list.length)}</span>}
                </span>

                {!isEmpty && (
                  <>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                    }}>
                      {toFa(installed.toLocaleString('fa-IR'))}
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginRight: 3 }}>{unit}</span>
                    </span>
                    {isRequired && need > 0 && st.pct !== null && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        color: st.tone === 'ok' ? 'var(--accent)'
                             : st.tone === 'warn' ? 'var(--warn)'
                             : st.tone === 'danger' ? 'var(--danger)'
                             : st.tone === 'over' ? 'var(--info)'
                             : 'var(--muted)',
                        minWidth: 34,
                        textAlign: 'left',
                      }}>
                        {toFa(Math.round(st.pct))}٪
                      </span>
                    )}
                  </>
                )}

                {isEmpty && isRequired && need > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    نیاز: {toFa(need.toLocaleString('fa-IR'))} {needUnit}
                  </span>
                )}

                {isEmpty && !isRequired && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>— ثبت نشده</span>
                )}

                {!isEmpty && (
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>‹</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // لیست تجهیزات یه دسته برای نمایش در مودال
  const detailList = detailCat ? (grouped[detailCat] || []) : [];
  const detailCatLabel = detailCat ? ((CATEGORY_LABELS as any)[detailCat]?.name || detailCat) : '';
  const detailColor = detailCat ? (CATEGORY_COLORS[detailCat] || 'var(--cat-auxiliary)') : 'var(--cat-auxiliary)';
  const detailInstalled = detailCat ? calcInstalled(detailCat, detailList) : 0;
  const detailNeed = detailCat ? (needByCategory[detailCat]?.value || 0) : 0;
  const detailNeedUnit = detailCat ? (needByCategory[detailCat]?.unit || unitForCategory(detailCat, detailList)) : '';
  const detailUnit = detailCat ? unitForCategory(detailCat, detailList) : '';

  return (
    <>
      <div style={{
        marginTop: 6,
        paddingTop: 8,
        borderTop: '1px dashed var(--border)',
      }}>
        <div style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '.3px',
          marginBottom: 4,
        }}>
          ⚙️ تجهیزات سالن
        </div>

        {renderGroup(REQUIRED_CATS, true)}
        {grouped['power']?.length || grouped['auxiliary']?.length ? renderGroup(OPTIONAL_CATS, false) : null}

        {/* legacy pills */}
        {legacy && (legacy.ventilationSystem || legacy.feederType || legacy.drinkerType || legacy.litterType) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {legacy.ventilationSystem && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>تهویه پایه: {legacy.ventilationSystem}</span>}
            {legacy.feederType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>دانخوری پایه: {legacy.feederType}</span>}
            {legacy.drinkerType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>آبخوری پایه: {legacy.drinkerType}</span>}
            {legacy.litterType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>بستر پایه: {legacy.litterType}</span>}
          </div>
        )}

        {/* ۸ دکمه افزودن */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 4,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px dashed var(--border)',
        }}>
          {ALL_CATS.map(cat => {
            const catColor = CATEGORY_COLORS[cat] || 'var(--cat-auxiliary)';
            const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => openPicker(cat)}
                style={{
                  padding: '8px 4px',
                  background: 'var(--input-bg)',
                  border: '1px dashed var(--border)',
                  borderRadius: 10,
                  color: 'var(--muted)',
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <CategoryIcon category={cat} size={16} weight="duotone" color={catColor} />
                <span>+ {label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* مودال جزئیات گروه */}
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
        saveNewEquip={saveNewEquip} typesForCategory={typesForCategory} equipment={equipment}
        editId={editId} setEditId={setEditId} currentEdit={currentEdit}
        editCount={editCount} setEditCount={setEditCount}
        editCap={editCap} setEditCap={setEditCap}
        saveEdit={saveEdit}
      />
    </>
  );
}
