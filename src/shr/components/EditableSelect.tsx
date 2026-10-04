import { useState } from 'react';
import { Btn, Field, Input, Modal } from './ui';
import EmojiPicker from './EmojiPicker';
import { useCustomOptions } from '../store/customOptions';
import { showConfirmAsync } from '../../cor/store/dialog';

export interface EditableOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: EditableOption[];
  customKey?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function EditableSelect({
  label, value, onChange, options, customKey, placeholder, required, error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [showEmoji, setShowEmoji] = useState(false);

  const { getByKey, addOption, updateOption, removeOption } = useCustomOptions();
  const customs = customKey ? getByKey(customKey) : [];

  const all: EditableOption[] = [
    ...options,
    ...customs.map(c => ({ value: c.name, label: c.name, icon: c.icon })),
  ];
  const current = all.find(o => o.value === value);

  const openAdd = () => {
    setEditId(null); setFormName(''); setFormIcon('🔧'); setFormOpen(true);
  };
  const openEdit = (id: string) => {
    const c = customs.find(x => x.id === id);
    if (!c) return;
    setEditId(id); setFormName(c.name); setFormIcon(c.icon); setFormOpen(true);
  };
  const saveItem = () => {
    const name = formName.trim();
    if (!name) return;
    if (editId) updateOption(editId, { name, icon: formIcon });
    else if (customKey) addOption(customKey, name, formIcon);
    setFormOpen(false);
  };
  const removeItem = async (id: string, name: string) => {
    const ok = await showConfirmAsync('حذف آیتم', '«' + name + '» حذف شود؟', { danger: true });
    if (ok) removeOption(id);
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        width: '100%', textAlign: 'right', padding: '10px 12px',
        background: 'var(--input-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)', color: current ? 'var(--text)' : 'var(--muted)',
        fontSize: 'var(--fs-base)', cursor: 'pointer',
      }}
    >
      {current ? (current.icon ? current.icon + ' ' + current.label : current.label) : (placeholder || '— انتخاب کنید —')}
    </button>
  );

  return (
    <>
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}

      <Modal open={open} onClose={() => setOpen(false)} title={label || 'انتخاب'}>
        {customKey && (
          <Btn variant="primary" full onClick={openAdd} style={{ marginBottom: 8 }}>
            + افزودن مورد جدید
          </Btn>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '55vh', overflowY: 'auto' }}>
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', background: 'var(--input-bg)',
                border: '1px solid ' + (value === o.value ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 'var(--fs-base)',
                color: 'var(--text)', textAlign: 'right',
              }}
            >
              <span>{o.icon ? o.icon + ' ' : ''}{o.label}</span>
              {value === o.value && <span style={{ color: 'var(--accent)' }}>✓</span>}
            </button>
          ))}
          {customs.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
              <button
                onClick={() => { onChange(c.name); setOpen(false); }}
                style={{
                  flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 12px', background: 'var(--input-bg)',
                  border: '1px solid ' + (value === c.name ? 'var(--accent-border)' : 'var(--border)'),
                  borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: 'var(--fs-base)',
                  color: 'var(--text)', textAlign: 'right',
                }}
              >
                <span>{c.icon} {c.name}</span>
                {value === c.name && <span style={{ color: 'var(--accent)' }}>✓</span>}
              </button>
              <Btn size="sm" onClick={() => openEdit(c.id)}>✏️</Btn>
              <Btn size="sm" onClick={() => removeItem(c.id, c.name)}>🗑️</Btn>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'ویرایش مورد' : 'افزودن مورد جدید'}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="primary" onClick={saveItem} disabled={!formName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
            <Btn onClick={() => setFormOpen(false)} style={{ flex: 1 }}>لغو</Btn>
          </div>
        }
      >
        <Field label="نام">
          <Input placeholder="مثلاً — آبخوری نیپل استیل" value={formName} onChange={e => setFormName(e.target.value)} />
        </Field>
        <Field label="آیکن">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
            }}>{formIcon}</div>
            <Btn onClick={() => setShowEmoji(true)} style={{ flex: 1 }}>انتخاب آیکن</Btn>
          </div>
        </Field>
      </Modal>

      <EmojiPicker open={showEmoji} onClose={() => setShowEmoji(false)} onPick={setFormIcon} />
    </>
  );
}
