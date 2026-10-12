/**
 * BirdNameField.tsx — فیلد نام پرنده (گونه) با Bottom Sheet
 *
 * مدل سه‌سطحی (طبق FOUNDATION):
 *   Species → Bird → Breed
 *
 * این فیلد فقط «گونه» رو انتخاب می‌کنه (مرغ، اردک، بوقلمون، ...)
 * کاربر می‌تونه گونه‌ی جدید اضافه/ویرایش/حذف کنه.
 */
import { useMemo, useState } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { Btn, BtnRow, ErrorBox, Field, Input, Modal } from '../../shr/components/ui';
import { DEFAULT_SPECIES, type Species } from './species';
import { useSet } from '../set/store';

export interface BirdPresetPick {
  name: string;
  standardKey?: string;
  isCustom: boolean;
  birdKind?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onPick: (pick: BirdPresetPick) => void;
  error?: string;
  excludeNames?: string[];
}

const ADD_NEW_VALUE = '__ADD_NEW_SPECIES__';

export default function BirdNameField({ value, onChange, onPick, error, excludeNames = [] }: Props) {
  const customSpecies = useSet((st: any) => st.customSpecies || []);
  const addSpecies = useSet((st: any) => st.addSpecies);
  const removeSpecies = useSet((st: any) => st.removeSpecies);

  const [showManage, setShowManage] = useState(false);
  const [editingKind, setEditingKind] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🐦');
  const [newErr, setNewErr] = useState('');

  const allSpecies: Species[] = useMemo(() => {
    return [...DEFAULT_SPECIES, ...customSpecies];
  }, [customSpecies]);

  const [notFound, setNotFound] = useState<string | null>(null);
  const options: AutoOption[] = useMemo(() => {
    const opts: AutoOption[] = [];
    const exclude = new Set(excludeNames.map(n => n.trim().toLowerCase()));

    for (const sp of allSpecies) {
      if (exclude.has(sp.nameFa.toLowerCase())) continue;

      opts.push({
        value: 'species:' + sp.kind,
        label: sp.nameFa,
        icon: sp.icon,
        group: sp.builtIn ? 'builtin' : 'custom',
        groupLabel: sp.builtIn ? 'پرنده‌های اصلی' : 'پرنده‌های سفارشی',
        groupIcon: sp.builtIn ? '🐔' : '⭐',
      });
    }

    opts.push({
      value: ADD_NEW_VALUE,
      label: 'مدیریت پرنده‌ها',
      icon: '⚙️',
      group: 'action',
      groupLabel: 'تنظیمات',
      groupIcon: '⚙️',
    });

    return opts;
  }, [allSpecies, excludeNames]);

  const handleSelect = (opt: AutoOption) => {
    if (opt.value === ADD_NEW_VALUE) {
      setEditingKind(null);
      setNewName('');
      setNewIcon('🐦');
      setNewErr('');
      setShowManage(true);
      return;
    }

    const kind = opt.value.replace('species:', '');
    const sp = allSpecies.find(s => s.kind === kind);
    if (!sp) return;

    onPick({
      name: sp.nameFa,
      standardKey: undefined,
      isCustom: !sp.builtIn,
      birdKind: sp.kind,
    });
  };

  const handleCustomText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // چک کن که قبلاً توی گونه‌ها هست یا نه (case-insensitive)
    const existing = allSpecies.find(
      s => s.nameFa.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      // اگه هست → مستقیم انتخابش کن
      onPick({
        name: existing.nameFa,
        isCustom: !existing.builtIn,
        birdKind: existing.kind,
      });
      return;
    }

    setNotFound(trimmed);
  };

  const startEdit = (sp: Species) => {
    setEditingKind(sp.kind);
    setNewName(sp.nameFa);
    setNewIcon(sp.icon);
    setNewErr('');
  };

  const cancelEdit = () => {
    setEditingKind(null);
    setNewName('');
    setNewIcon('🐦');
    setNewErr('');
  };

  const handleSave = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNewErr('نام پرنده اجباری است'); return; }

    // چک تکراری (به‌جز خودش در حالت ویرایش)
    const dup = allSpecies.find(s =>
      s.nameFa.toLowerCase() === trimmed.toLowerCase() && s.kind !== editingKind
    );
    if (dup) { setNewErr('این نام قبلاً هست'); return; }

    let finalKind = editingKind;

    if (editingKind) {
      // ویرایش: حذف قدیمی + افزودن جدید (با حفظ kind)
      removeSpecies(editingKind);
      addSpecies({ kind: editingKind, nameFa: trimmed, icon: newIcon });
    } else {
      // افزودن جدید
      const slug = trimmed.toLowerCase().replace(/\s+/g, '-');
      const kind = 'custom-' + slug + '-' + Date.now().toString(36);
      finalKind = kind;
      addSpecies({ kind, nameFa: trimmed, icon: newIcon });
    }

    cancelEdit();
    setShowManage(false);

    // 🆕 auto-pick: بعد از افزودن/ویرایش، خودکار انتخابش کن
    if (finalKind) {
      onPick({
        name: trimmed,
        standardKey: undefined,
        isCustom: true,
        birdKind: finalKind,
      });
    }
  };

  const handleDelete = (kind: string) => {
    removeSpecies(kind);
  };

  return (
    <>
      <Modal
        open={!!notFound}
        onClose={() => setNotFound(null)}
        title="پرنده پیدا نشد"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={() => { setNotFound(null); setShowManage(true); }}>مدیریت پرنده‌ها</Btn>
            <Btn onClick={() => setNotFound(null)}>بستن</Btn>
          </BtnRow>
        }
      >
        <div style={{ padding: 'var(--pad-normal)', lineHeight: 1.8, textAlign: 'center' }}>
          <div style={{ fontSize: '2em', marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>«{notFound}» توی پرنده‌ها نیست</div>
          <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
            برای ساختنش از «مدیریت پرنده‌ها» استفاده کن
          </div>
        </div>
      </Modal>
      <AutocompleteSheet
        value={value}
        onChange={onChange}
        onSelect={handleSelect}
        onSubmit={handleCustomText}
        options={options}
        placeholder="مثلاً — مرغ یا بوقلمون"
        customLabel="افزودن پرنده دلخواه"
        title="انتخاب پرنده"
        error={error}
        actionValues={[ADD_NEW_VALUE]}
      />

      <Modal
        open={showManage}
        onClose={() => { cancelEdit(); setShowManage(false); }}
        title="مدیریت پرنده‌ها"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={handleSave}>
              {editingKind ? 'ذخیره ویرایش' : 'افزودن'}
            </Btn>
            <Btn onClick={() => { cancelEdit(); setShowManage(false); }}>بستن</Btn>
          </BtnRow>
        }
      >
        {/* فرم افزودن/ویرایش */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            {editingKind ? '✏️ ویرایش پرنده' : '➕ افزودن پرنده‌ی جدید'}
          </div>
          <Field label="نام پرنده" required hint="مثلاً — کبک، شترمرغ، قرقاول">
            <Input
              value={newName}
              onChange={(e: any) => { setNewName(e.target.value); setNewErr(''); }}
              placeholder="نام پرنده..."
              autoFocus
            />
          </Field>
          <Field label="ایموجی" hint="نماد این پرنده">
            <Input
              value={newIcon}
              onChange={(e: any) => setNewIcon(e.target.value)}
              placeholder="🐦"
              maxLength={2}
            />
          </Field>
          {newErr && <ErrorBox>{newErr}</ErrorBox>}
          {editingKind && (
            <Btn size="sm" onClick={cancelEdit} style={{ marginTop: 8 }}>انصراف از ویرایش</Btn>
          )}
        </div>

        {/* لیست گونه‌های سفارشی */}
        {customSpecies.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
              پرنده‌های سفارشی ({customSpecies.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {customSpecies.map((sp: Species) => (
                <div key={sp.kind} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', background: 'var(--input-bg)',
                  borderRadius: 'var(--r-sm)',
                }}>
                  <span style={{ fontSize: 18 }}>{sp.icon}</span>
                  <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 600 }}>{sp.nameFa}</span>
                  <button
                    type="button"
                    onClick={() => startEdit(sp)}
                    aria-label={`ویرایش ${sp.nameFa}`}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: 4, fontSize: 16,
                    }}>✏️</button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sp.kind)}
                    aria-label={`حذف ${sp.nameFa}`}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      padding: 4, fontSize: 16,
                    }}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {customSpecies.length === 0 && (
          <div style={{
            marginTop: 16, padding: 12, textAlign: 'center',
            fontSize: 'var(--fs-sm)', color: 'var(--muted)',
            background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
          }}>
            هنوز پرنده‌ی سفارشی نساخته‌ای
          </div>
        )}
      </Modal>
    </>
  );
}
