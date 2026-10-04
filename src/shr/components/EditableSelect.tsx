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

const ROW_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  minHeight: 52,
  background: 'transparent',
  border: 'none',
  borderRadius: 'var(--r-md)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-base)',
  textAlign: 'right',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
};

const ROW_SELECTED: React.CSSProperties = {
  background: 'var(--accent-soft)',
};

export default function EditableSelect({
  label, value, onChange, options, customKey, placeholder, required, error,
}: Props) {
  const [open, setOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [showEmoji, setShowEmoji] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);

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
        fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {current ? (current.icon ? current.icon + ' ' + current.label : current.label) : (placeholder || '— انتخاب کنید —')}
    </button>
  );

  return (
    <>
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}

      <Modal open={open} onClose={() => setOpen(false)} title={label || 'انتخاب'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 }}>
          {customKey && (
            <button
              type="button"
              onClick={openAdd}
              style={{
                ...ROW_BASE,
                justifyContent: 'flex-start',
                color: 'var(--accent)',
                fontWeight: 600,
                border: '1px dashed var(--accent-border)',
                background: 'var(--accent-soft)',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              <span>افزودن مورد جدید</span>
            </button>
          )}

          {options.map(o => {
            const selected = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                onMouseEnter={() => setHoverId(o.value)}
                onMouseLeave={() => setHoverId(null)}
                style={{
                  ...ROW_BASE,
                  ...(selected ? ROW_SELECTED : (hoverId === o.value ? { background: 'var(--input-bg)' } : {})),
                }}
              >
                <span style={{ flex: 1, textAlign: 'right' }}>
                  {o.icon ? o.icon + ' ' : ''}{o.label}
                </span>
                {selected && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
              </button>
            );
          })}

          {customs.map(c => {
            const selected = value === c.name;
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  ...(selected ? ROW_SELECTED : {}),
                  borderRadius: 'var(--r-md)',
                }}
              >
                <button
                  type="button"
                  onClick={() => { onChange(c.name); setOpen(false); }}
                  onMouseEnter={() => setHoverId(c.id)}
                  onMouseLeave={() => setHoverId(null)}
                  style={{
                    ...ROW_BASE,
                    flex: 1,
                    background: (!selected && hoverId === c.id) ? 'var(--input-bg)' : 'transparent',
                  }}
                >
                  <span style={{ flex: 1, textAlign: 'right' }}>{c.icon} {c.name}</span>
                  {selected && <span style={{ color: 'var(--accent)', fontSize: 16 }}>✓</span>}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(c.id)}
                  aria-label="ویرایش"
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--r-sm)',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✏️</button>
                <button
                  type="button"
                  onClick={() => removeItem(c.id, c.name)}
                  aria-label="حذف"
                  style={{
                    width: 36, height: 36, borderRadius: 'var(--r-sm)',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 14, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginLeft: 4,
                  }}
                >🗑️</button>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editId ? 'ویرایش مورد' : 'افزودن مورد جدید'}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={() => setFormOpen(false)} style={{ flex: 1 }}>لغو</Btn>
            <Btn variant="primary" onClick={saveItem} disabled={!formName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
          </div>
        }
      >
        <Field label="نام">
          <Input placeholder="مثلاً — آبخوری نیپل استیل" value={formName} onChange={e => setFormName(e.target.value)} />
        </Field>
        <Field label="آیکن">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{
              width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
            }}>{formIcon}</div>
            <Btn onClick={() => setShowEmoji(true)} style={{ flex: 1 }}>انتخاب از ایموجی‌ها</Btn>
          </div>
        </Field>
      </Modal>

      <EmojiPicker open={showEmoji} onClose={() => setShowEmoji(false)} onPick={setFormIcon} />
    </>
  );
}
