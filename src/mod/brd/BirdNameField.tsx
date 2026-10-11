/**
 * BirdNameField.tsx — فیلد نام پرنده (گونه) با Bottom Sheet
 *
 * مدل سه‌سطحی (طبق FOUNDATION):
 *   Species → Bird → Breed
 *
 * این فیلد فقط «گونه» رو انتخاب می‌کنه (مرغ، اردک، بوقلمون، ...)
 * کاربر می‌تونه گونه‌ی جدید هم اضافه کنه (کبک، شترمرغ، ...).
 */
import { useMemo, useState } from 'react';
import AutocompleteSheet, { type AutoOption } from '../../shr/components/AutocompleteSheet';
import { Btn, Field, Input, Modal, ErrorBox, BtnRow } from '../../shr/components/ui';
import { DEFAULT_SPECIES, type Species } from './species';
import { useSet } from '../set/store';

export interface BirdPresetPick {
  name: string;
  cycleDays: number | null;
  fcrStandard: number | null;
  standardKey?: string;
  isCustom: boolean;
  birdKind?: string;         // 'chicken' یا custom مثل 'pheasant'
  purpose?: string;          // اختیاری — الان کاربر انتخاب نمی‌کنه
  categoryId?: string;       // legacy
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

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🐦');
  const [newErr, setNewErr] = useState('');

  const allSpecies: Species[] = useMemo(() => {
    return [...DEFAULT_SPECIES, ...customSpecies];
  }, [customSpecies]);

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
        groupLabel: sp.builtIn ? '🐔 پرنده‌های اصلی' : '⭐ پرنده‌های سفارشی',
        groupIcon: sp.builtIn ? '🐔' : '⭐',
      });
    }

    // گزینه «افزودن گونه جدید»
    opts.push({
      value: ADD_NEW_VALUE,
      label: '+ افزودن پرنده‌ی جدید',
      icon: '➕',
      group: 'action',
      groupLabel: '➕ افزودن',
      groupIcon: '➕',
    });

    return opts;
  }, [allSpecies, excludeNames]);

  const handleSelect = (opt: AutoOption) => {
    if (opt.value === ADD_NEW_VALUE) {
      setNewName('');
      setNewIcon('🐦');
      setNewErr('');
      setShowAdd(true);
      return;
    }

    const kind = opt.value.replace('species:', '');
    const sp = allSpecies.find(s => s.kind === kind);
    if (!sp) return;

    onPick({
      name: sp.nameFa,
      cycleDays: null,
      fcrStandard: null,
      standardKey: undefined,
      isCustom: !sp.builtIn,
      birdKind: sp.kind,
      // purpose: undefined — کاربر توی نژاد انتخاب می‌کنه
    });
  };

  const handleCustomText = (text: string) => {
    // کاربر تایپ کرد ولی انتخاب نکرد
    onPick({
      name: text,
      cycleDays: null,
      fcrStandard: null,
      isCustom: true,
      birdKind: undefined,
    });
  };

  const handleAddSpecies = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNewErr('نام پرنده اجباری است'); return; }

    // چک تکراری
    const dup = allSpecies.find(s => s.nameFa.toLowerCase() === trimmed.toLowerCase());
    if (dup) { setNewErr('این نام قبلاً هست'); return; }

    // شناسه یکتا برای custom
    const kind = 'custom-' + trimmed.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || ('custom-' + Date.now());

    addSpecies({ kind, nameFa: trimmed, icon: newIcon });
    setShowAdd(false);

    // auto-pick بعد از افزودن
    onPick({
      name: trimmed,
      cycleDays: null,
      fcrStandard: null,
      standardKey: undefined,
      isCustom: true,
      birdKind: kind,
    });
  };

  return (
    <>
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
      />

      {/* مودال افزودن گونه‌ی جدید */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="افزودن پرنده‌ی جدید"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={handleAddSpecies}>افزودن</Btn>
            <Btn onClick={() => setShowAdd(false)}>لغو</Btn>
          </BtnRow>
        }
      >
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
      </Modal>
    </>
  );
}
