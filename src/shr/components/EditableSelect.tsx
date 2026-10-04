import { useState } from 'react';
import { Btn, Field, Input, Modal } from './ui';
import EmojiGrid from './EmojiGrid';
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

const PALETTE = {
  blue:   { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', fg: '#1d4ed8' },
  cyan:   { bg: 'linear-gradient(135deg,#cffafe,#a5f3fc)', fg: '#0e7490' },
  red:    { bg: 'linear-gradient(135deg,#fee2e2,#fecaca)', fg: '#b91c1c' },
  amber:  { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', fg: '#b45309' },
  purple: { bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', fg: '#6d28d9' },
  green:  { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', fg: '#15803d' },
  orange: { bg: 'linear-gradient(135deg,#ffedd5,#fed7aa)', fg: '#c2410c' },
  slate:  { bg: 'linear-gradient(135deg,#e2e8f0,#cbd5e1)', fg: '#334155' },
};

function paletteForIcon(icon: string): { bg: string; fg: string } {
  const code = (icon || '').codePointAt(0) || 0;
  const keys = Object.keys(PALETTE) as (keyof typeof PALETTE)[];
  return PALETTE[keys[code % keys.length]];
}

export default function EditableSelect({
  label, value, onChange, options, customKey, placeholder, required, error,
  variant = 'modal',
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);

  const { getByKey, addOption, updateOption, removeOption } = useCustomOptions();
  const customs = customKey ? getByKey(customKey) : [];

  const all: EditableOption[] = [
    ...options,
    ...customs.map(c => ({ value: c.name, label: c.name, icon: c.icon })),
  ];
  const current = all.find(o => o.value === value);

  const resetForm = () => { setEditId(null); setFormName(''); setFormIcon('🔧'); setEmojiOpen(false); };
  const openAdd = () => { resetForm(); setView('form'); };
  const openEdit = (id: string) => {
    const c = customs.find(x => x.id === id);
    if (!c) return;
    setEditId(id); setFormName(c.name); setFormIcon(c.icon); setEmojiOpen(false); setView('form');
  };
  const backToList = () => { resetForm(); setView('list'); };
  const closeAll = () => { resetForm(); setView('list'); setOpen(false); };

  const saveItem = () => {
    const name = formName.trim();
    if (!name) return;
    if (editId) updateOption(editId, { name, icon: formIcon });
    else if (customKey) { addOption(customKey, name, formIcon); setHighlight(name); }
    resetForm();
    setView('list');
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

  const renderCard = (o: EditableOption, key: string, sub?: string, onEdit?: () => void, onRemove?: (e: React.MouseEvent) => void) => {
    const selected = value === o.value;
    const isHi = highlight === o.value;
    const p = paletteForIcon(o.icon || '');
    return (
      <div key={key} style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => { onChange(o.value); closeAll(); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(o.value); closeAll(); } }}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px',
            background: 'var(--card-solid)',
            border: '1.5px solid ' + (selected || isHi ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 16,
            color: 'var(--text)', fontFamily: 'inherit',
            textAlign: 'right', cursor: 'pointer',
            boxShadow: selected
              ? '0 4px 20px rgba(22,163,74,.18), 0 2px 6px rgba(15,23,42,.06)'
              : '0 1px 3px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.05)',
            position: 'relative',
            transition: 'transform 140ms, box-shadow 200ms',
          }}>
          <div style={{
            width: 52, height: 52, borderRadius: 15,
            background: p.bg, color: p.fg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, flexShrink: 0,
            boxShadow: '0 3px 8px rgba(15,23,42,.08)',
          }}>{o.icon || '•'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {o.label}
            </div>
            {sub && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, fontWeight: 500 }}>{sub}</div>
            )}
          </div>
          {selected && (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--accent)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>✓</div>
          )}
          {!selected && onEdit && onRemove && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button type="button" aria-label="ویرایش"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', fontSize: 14, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .6,
                }}>✏️</button>
              <button type="button" aria-label="حذف"
                onClick={(e) => { e.stopPropagation(); onRemove(e); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', fontSize: 14, padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .6,
                }}>🗑️</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {options.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '4px 4px 0',
        }}>پیش‌فرض‌ها</div>
      )}
      {options.map(o => renderCard(o, o.value))}

      {customs.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '8px 4px 0',
        }}>سفارشی</div>
      )}
      {customs.map(c =>
        renderCard(
          { value: c.name, label: c.name, icon: c.icon },
          c.id,
          'قابل ویرایش',
          () => openEdit(c.id),
          (e) => removeItem(e, c.id, c.name)
        )
      )}
    </div>
  );

  const formView = (
    <div>
      <Field label="نام">
        <Input
          placeholder="مثلاً — آبخوری نیپل استیل"
          value={formName}
          onChange={e => setFormName(e.target.value)}
          autoFocus
        />
      </Field>

      <Field label="آیکن">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
            background: paletteForIcon(formIcon).bg,
            color: paletteForIcon(formIcon).fg,
            borderRadius: 16,
            boxShadow: '0 3px 10px rgba(15,23,42,.08)',
          }}>{formIcon}</div>
          <Btn onClick={() => setEmojiOpen(o => !o)} style={{ flex: 1 }}>
            {emojiOpen ? 'بستن ایموجی‌ها' : 'انتخاب از ایموجی‌ها'}
          </Btn>
        </div>
      </Field>

      {emojiOpen && (
        <div style={{
          marginTop: 4, padding: 10,
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
        }}>
          <EmojiGrid value={formIcon} onPick={setFormIcon} />
        </div>
      )}
    </div>
  );

  const headerAction = (customKey && view === 'list') ? (
    <button
      type="button"
      onClick={openAdd}
      aria-label="افزودن مورد جدید"
      style={{
        width: 36, height: 36, borderRadius: 11,
        background: 'var(--accent)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 300, lineHeight: 1,
        fontFamily: 'inherit',
        boxShadow: '0 3px 10px rgba(22,163,74,.3)',
      }}
    >+</button>
  ) : null;

  const modalTitle = view === 'form'
    ? (editId ? 'ویرایش مورد' : 'افزودن مورد جدید')
    : (label || 'انتخاب');

  const modalFooter = view === 'form' ? (
    <div style={{ display: 'flex', gap: 8 }}>
      <Btn onClick={backToList} style={{ flex: 1 }}>لغو</Btn>
      <Btn variant="primary" onClick={saveItem} disabled={!formName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
    </div>
  ) : undefined;

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
      </>
    );
  }

  return (
    <>
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}
      <Modal
        open={open}
        onClose={view === 'form' ? backToList : closeAll}
        title={modalTitle}
        footer={modalFooter}
        headerAction={headerAction}
      >
        {view === 'form' ? formView : renderList()}
      </Modal>
    </>
  );
}
