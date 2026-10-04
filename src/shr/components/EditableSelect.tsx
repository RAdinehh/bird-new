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
  variant?: 'modal' | 'inline';
}

const ITEM_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  minHeight: 56,
  background: 'var(--card-solid)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-base)',
  fontWeight: 500,
  textAlign: 'right',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'background 150ms, border-color 150ms, transform 120ms',
};

const ICON_BOX: React.CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 'var(--r-md)',
  background: 'var(--input-bg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  flexShrink: 0,
};

const ICON_BOX_SEL: React.CSSProperties = {
  ...ICON_BOX,
  background: 'var(--accent-soft)',
};

export default function EditableSelect({
  label, value, onChange, options, customKey, placeholder, required, error,
  variant = 'modal',
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
      onClick={() => variant === 'inline' ? setOpen(o => !o) : setOpen(true)}
      style={{
        width: '100%', textAlign: 'right', padding: '10px 12px',
        background: 'var(--input-bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-sm)', color: current ? 'var(--text)' : 'var(--muted)',
        fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ flex: 1, textAlign: 'right' }}>
        {current ? (current.icon ? current.icon + ' ' + current.label : current.label) : (placeholder || '— انتخاب کنید —')}
      </span>
      {variant === 'inline' && (
        <span style={{ color: 'var(--muted)', fontSize: 11, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }}>▼</span>
      )}
    </button>
  );

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {customKey && (
        <button
          type="button"
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', minHeight: 52,
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--accent)', fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'var(--fs-base)', textAlign: 'right',
            width: '100%', boxSizing: 'border-box',
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 'var(--r-md)',
            background: 'var(--card-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}>＋</span>
          <span style={{ flex: 1 }}>افزودن مورد جدید</span>
        </button>
      )}

      {options.length > 0 && (
        <div style={{
          fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.5px', padding: '8px 4px 0',
        }}>پیش‌فرض‌ها</div>
      )}

      {options.map(o => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            style={{
              ...ITEM_BASE,
              borderColor: selected ? 'var(--accent-border)' : 'var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--card-solid)',
            }}
          >
            <span style={selected ? ICON_BOX_SEL : ICON_BOX}>{o.icon || '•'}</span>
            <span style={{ flex: 1 }}>{o.label}</span>
            {selected && <span style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 700 }}>✓</span>}
          </button>
        );
      })}

      {customs.length > 0 && (
        <div style={{
          fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.5px', padding: '12px 4px 0',
        }}>سفارشی (قابل ویرایش)</div>
      )}

      {customs.map(c => {
        const selected = value === c.name;
        return (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <button
              type="button"
              onClick={() => { onChange(c.name); setOpen(false); }}
              style={{
                ...ITEM_BASE,
                flex: 1,
                borderColor: selected ? 'var(--accent-border)' : 'var(--border)',
                background: selected ? 'var(--accent-soft)' : 'var(--card-solid)',
              }}
            >
              <span style={selected ? ICON_BOX_SEL : ICON_BOX}>{c.icon}</span>
              <span style={{ flex: 1 }}>{c.name}</span>
              {selected && <span style={{ color: 'var(--accent)', fontSize: 18, fontWeight: 700 }}>✓</span>}
            </button>
            <button type="button" onClick={() => openEdit(c.id)} aria-label="ویرایش" style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--card-solid)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 15, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>✏️</button>
            <button type="button" onClick={() => removeItem(c.id, c.name)} aria-label="حذف" style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--card-solid)', border: '1px solid var(--border)',
              cursor: 'pointer', fontSize: 15, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🗑️</button>
          </div>
        );
      })}
    </div>
  );

  const formModal = (
    <>
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
            }}>{formIcon}</div>
            <Btn onClick={() => setShowEmoji(true)} style={{ flex: 1 }}>انتخاب از ایموجی‌ها</Btn>
          </div>
        </Field>
      </Modal>
      <EmojiPicker open={showEmoji} onClose={() => setShowEmoji(false)} onPick={setFormIcon} />
    </>
  );

  if (variant === 'inline') {
    return (
      <>
        {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}
        {open && (
          <div style={{
            marginTop: 8,
            background: 'var(--input-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: 10,
          }}>
            {renderList()}
          </div>
        )}
        {formModal}
      </>
    );
  }

  return (
    <>
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}
      <Modal open={open} onClose={() => setOpen(false)} title={label || 'انتخاب'}>
        {renderList()}
      </Modal>
      {formModal}
    </>
  );
}
