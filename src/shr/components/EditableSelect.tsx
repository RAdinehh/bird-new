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

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  ventilation: { bg: 'rgba(59,130,246,.14)',  fg: '#2563eb' },
  feeding:     { bg: 'rgba(245,158,11,.16)',  fg: '#d97706' },
  drinking:    { bg: 'rgba(6,182,212,.14)',   fg: '#0891b2' },
  heating:     { bg: 'rgba(239,68,68,.14)',   fg: '#dc2626' },
  lighting:    { bg: 'rgba(234,179,8,.18)',   fg: '#ca8a04' },
  litter:      { bg: 'rgba(139,92,246,.14)',  fg: '#7c3aed' },
  power:       { bg: 'rgba(249,115,22,.14)',  fg: '#ea580c' },
  auxiliary:   { bg: 'rgba(100,116,139,.14)', fg: '#475569' },
};

function colorForIcon(_icon: string): { bg: string; fg: string } {
  return { bg: 'rgba(22,163,74,.14)', fg: '#16a34a' };
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

  const renderList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

      {options.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '6px 4px 4px',
        }}>پیش‌فرض‌ها</div>
      )}

      {options.map(o => {
        const selected = value === o.value;
        const c = colorForIcon(o.icon || '');
        return (
          <button key={o.value} type="button"
            onClick={() => { onChange(o.value); closeAll(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', minHeight: 52,
              background: selected ? 'var(--accent-soft)' : 'var(--card-elevated)',
              border: '1px solid ' + (selected ? 'var(--accent-border)' : 'var(--border)'),
              borderRadius: 14,
              color: 'var(--text)', fontFamily: 'inherit',
              fontSize: 'var(--fs-base)', fontWeight: 500,
              textAlign: 'right', cursor: 'pointer',
              width: '100%', boxSizing: 'border-box',
              boxShadow: selected
                ? '0 2px 8px rgba(22,163,74,.12)'
                : '0 1px 2px rgba(15,23,42,.05), 0 2px 6px rgba(15,23,42,.04)',
              transition: 'transform 120ms, box-shadow 150ms',
            }}>
            <span style={{
              width: 36, height: 36, borderRadius: 10,
              background: c.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>{o.icon || '•'}</span>
            <span style={{ flex: 1 }}>{o.label}</span>
            {selected && <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>}
          </button>
        );
      })}

      {customs.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '14px 4px 4px',
        }}>سفارشی</div>
      )}

      {customs.map(c => {
        const selected = value === c.name;
        const isHi = highlight === c.name;
        const col = colorForIcon(c.icon);
        return (
          <div key={c.id} style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => { onChange(c.name); closeAll(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(c.name); closeAll(); } }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', minHeight: 52,
                background: selected ? 'var(--accent-soft)' : 'var(--card-elevated)',
                border: '1px solid ' + (selected || isHi ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 14,
                color: 'var(--text)', fontFamily: 'inherit',
                fontSize: 'var(--fs-base)', fontWeight: 500,
                textAlign: 'right', cursor: 'pointer',
                boxSizing: 'border-box',
                boxShadow: selected
                  ? '0 2px 8px rgba(22,163,74,.12)'
                  : '0 1px 2px rgba(15,23,42,.05), 0 2px 6px rgba(15,23,42,.04)',
              }}>
              <span style={{
                width: 36, height: 36, borderRadius: 10,
                background: col.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>{c.icon}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
              {selected && <span style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 700 }}>✓</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center' }}>
              <button type="button" aria-label="ویرایش"
                onClick={() => openEdit(c.id)}
                style={{
                  width: 32, height: 22, borderRadius: 6,
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  cursor: 'pointer', fontSize: 11, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: .7, padding: 0,
                }}>✏️</button>
              <button type="button" aria-label="حذف"
                onClick={(e) => removeItem(e, c.id, c.name)}
                style={{
                  width: 32, height: 22, borderRadius: 6,
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  cursor: 'pointer', fontSize: 11, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', opacity: .7, padding: 0,
                }}>🗑️</button>
            </div>
          </div>
        );
      })}
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
            width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
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

  // ─── Header Action Button ───
  const headerAction = (customKey && view === 'list') ? (
    <button
      type="button"
      onClick={openAdd}
      aria-label="افزودن مورد جدید"
      style={{
        width: 32, height: 32, borderRadius: 'var(--r-md)',
        background: 'var(--accent)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 400, lineHeight: 1,
        fontFamily: 'inherit',
        boxShadow: '0 2px 6px rgba(22,163,74,.3)',
      }}
    >+</button>
  ) : null;

  const modalTitle = view === 'form'
    ? (editId ? 'ویرایش مورد' : 'افزودن مورد جدید')
    : (label || 'انتخاب');

  const modalFooter = view === 'form' ? (
    <div style={{ display: 'flex', gap: 6 }}>
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
