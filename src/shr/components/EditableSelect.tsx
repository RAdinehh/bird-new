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

const ICON_BOX: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 10,
  background: 'var(--input-bg)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 18, flexShrink: 0,
};

const ICON_BOX_SEL: React.CSSProperties = {
  ...ICON_BOX, background: 'rgba(255,255,255,.7)',
};

const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '8px 10px',
  background: 'var(--card-solid)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 500,
  textAlign: 'right', cursor: 'pointer',
  width: '100%', boxSizing: 'border-box',
  boxShadow: '0 1px 2px rgba(15,23,42,.04)',
  transition: 'transform 120ms, box-shadow 120ms',
};

const MINI_BTN: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8,
  background: 'transparent', border: 'none',
  cursor: 'pointer', fontSize: 14, flexShrink: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: .55,
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

  const openAdd = () => { setEditId(null); setFormName(''); setFormIcon('🔧'); setFormOpen(true); };
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
  const removeItem = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {customKey && (
        <button type="button" onClick={openAdd} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', minHeight: 48,
          background: 'var(--accent-soft)',
          border: '1px dashed var(--accent-border)',
          borderRadius: 12,
          color: 'var(--accent)', fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-base)',
          textAlign: 'right', width: '100%', boxSizing: 'border-box',
        }}>
          <span style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'var(--card-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0, fontWeight: 600,
          }}>+</span>
          <span style={{ flex: 1 }}>افزودن مورد جدید</span>
        </button>
      )}

      {options.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '10px 4px 2px',
        }}>پیش‌فرض‌ها</div>
      )}

      {options.map(o => {
        const selected = value === o.value;
        return (
          <button key={o.value} type="button"
            onClick={() => { onChange(o.value); setOpen(false); }}
            style={{
              ...ROW,
              borderColor: selected ? 'var(--accent-border)' : 'var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--card-solid)',
            }}>
            <span style={selected ? ICON_BOX_SEL : ICON_BOX}>{o.icon || '•'}</span>
            <span style={{ flex: 1 }}>{o.label}</span>
            {selected && <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>}
          </button>
        );
      })}

      {customs.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '12px 4px 2px',
        }}>سفارشی</div>
      )}

      {customs.map(c => {
        const selected = value === c.name;
        return (
          <button key={c.id} type="button"
            onClick={() => { onChange(c.name); setOpen(false); }}
            style={{
              ...ROW, position: 'relative',
              borderColor: selected ? 'var(--accent-border)' : 'var(--border)',
              background: selected ? 'var(--accent-soft)' : 'var(--card-solid)',
              paddingLeft: 6,
            }}>
            <span style={selected ? ICON_BOX_SEL : ICON_BOX}>{c.icon}</span>
            <span style={{ flex: 1 }}>{c.name}</span>
            {selected && <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>}
            <span style={{ display: 'flex', gap: 2 }}>
              <span role="button" aria-label="ویرایش"
                onClick={(e) => { e.stopPropagation(); openEdit(c.id); }}
                style={MINI_BTN}>✏️</span>
              <span role="button" aria-label="حذف"
                onClick={(e) => removeItem(e, c.id, c.name)}
                style={MINI_BTN}>🗑️</span>
            </span>
          </button>
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
            marginTop: 8, background: 'var(--input-bg)',
            border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 10,
          }}>{renderList()}</div>
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
