import { useState } from 'react';
import { Btn, Field, Input, Modal, ErrorBox } from '../../../../shr/components/ui';
import { DEFAULT_STANDARDS, type BirdStandard } from '../index';

export function AddBirdModal({
  open, onClose, existingCustom, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  existingCustom: Record<string, BirdStandard>;
  onAdd: (key: string, nameFa: string, nameEn: string, birdName: string, template: BirdStandard) => void;
}) {
  const [customNameFa, setCustomNameFa] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [customBirdName, setCustomBirdName] = useState('مرغ');
  const [templateKey, setTemplateKey] = useState<string>('marandi');
  const [err, setErr] = useState('');

  const allStandardKeys = Object.keys(DEFAULT_STANDARDS);
  const existingKeys = Object.keys(existingCustom);

  const reset = () => {
    setCustomNameFa('');
    setCustomNameEn('');
    setCustomBirdName('مرغ');
    setTemplateKey('marandi');
    setErr('');
  };

  const handleAdd = () => {
    if (!customNameFa.trim()) { setErr('نام نژاد اجباری است'); return; }
    if (!customBirdName.trim()) { setErr('نام پرنده مادر اجباری است'); return; }
    const key = customNameFa.trim().toLowerCase().replace(/\s+/g, '-');
    if (allStandardKeys.includes(key) || existingKeys.includes(key)) {
      setErr('این نام قبلاً هست');
      return;
    }
    const template = existingCustom[templateKey] || DEFAULT_STANDARDS[templateKey];
    onAdd(key, customNameFa.trim(), customNameEn.trim() || customNameFa.trim(), customBirdName.trim(), template);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="افزودن نژاد جدید"
      footer={
        <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
          <Btn onClick={handleAdd} variant="primary" full>افزودن</Btn>
          <Btn onClick={onClose} full>لغو</Btn>
        </div>
      }
    >
      <Field label="پرنده مادر" required hint="مرغ، بوقلمون، اردک، ...">
        <Input value={customBirdName} onChange={e => setCustomBirdName(e.target.value)} placeholder="مرغ" />
      </Field>
      <Field label="نام نژاد (فارسی)" required>
        <Input value={customNameFa} onChange={e => setCustomNameFa(e.target.value)} placeholder="مثلاً — لاری" />
      </Field>
      <Field label="نام نژاد (انگلیسی)">
        <Input value={customNameEn} onChange={e => setCustomNameEn(e.target.value)} placeholder="Lari" />
      </Field>
      <Field label="کپی مقادیر از" hint="یک نژاد مشابه">
        <select
          value={templateKey}
          onChange={e => setTemplateKey(e.target.value)}
          style={{
            width: '100%', height: 38,
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '0 10px',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
          }}
        >
          {[...allStandardKeys, ...existingKeys].map(k => {
            const std = existingCustom[k] || DEFAULT_STANDARDS[k];
            return <option key={k} value={k}>{std.nameFa}</option>;
          })}
        </select>
      </Field>
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-xs)',
        color: 'var(--muted)',
        lineHeight: 1.8,
      }}>
        💡 تمام مقادیر از نژاد انتخاب‌شده کپی می‌شود.
      </div>
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
