import { useState } from 'react';
import { Btn, Field, Input, Modal } from './ui';
import EmojiPicker from './EmojiPicker';
import { useCustomOptions } from '../store/customOptions';
import { showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';

export interface EditableOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
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
  usageCheck?: (name: string) => number;
}

const ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  minHeight: 58,
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfcfd 100%)',
  border: '1.5px solid var(--border)',
  borderRadius: 15,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-base)',
  fontWeight: 500,
  textAlign: 'right',
  cursor: 'pointer',
  width: '100%',
  boxSizing: 'border-box',
  transition: 'transform 120ms, box-shadow 180ms, border-color 180ms',
  boxShadow: '0 1px 2px rgba(15,23,42,.05), 0 3px 10px rgba(15,23,42,.05)',
};

const ICON: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 13,
  background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8ef 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 22,
  flexShrink: 0,
  boxShadow: 'inset 0 1px 2px rgba(255,255,255,.8), 0 1px 2px rgba(15,23,42,.05)',
};

const MINI: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  fontSize: 17,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export default function EditableSelect({
  label, value, onChange, options, customKey, placeholder, required, error, usageCheck,
}: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('🔧');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ id: string; name: string } | null>(null);

  const { getByKey, addOption, updateOption, removeOption, hideOption, unhideOption } = useCustomOptions();
  const customs = customKey ? getByKey(customKey) : [];

  const all: EditableOption[] = [
    ...options,
    ...customs.map(c => ({ value: c.name, label: c.name, icon: c.icon })),
  ];
  const current = all.find(o => o.value === value);
  const isOrphan = !!value && !current;

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
    const count = usageCheck ? usageCheck(name) : 0;
    const message = count > 0
      ? '«' + name + '» در ' + count + ' مورد استفاده شده.\n\nاگه حذف کنی، از لیست انتخاب غیب می‌شه ولی داده‌های قبلی دست‌نخورده می‌مونن.\nاز تنظیمات → گزینه‌های مخفی می‌تونی برگردونی.'
      : '«' + name + '» جای دیگه‌ای استفاده نشده.\n\nحذف بشه؟';
    const ok = await showConfirmAsync('حذف آیتم', message, { danger: true });
    if (!ok) return;
    hideOption(id);
    setUndoData({ id, name });
    setTimeout(() => {
      setUndoData(cur => cur && cur.id === id ? null : cur);
    }, 5000);
  };

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        width: '100%', textAlign: 'right', padding: '10px 12px',
        background: 'var(--input-bg)',
        border: '1px solid ' + (isOrphan ? 'rgba(217,119,6,.5)' : 'var(--border)'),
        borderRadius: 'var(--r-sm)',
        color: isOrphan ? 'var(--warn)' : (current ? 'var(--text)' : 'var(--muted)'),
        fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 8,
      }}
    >
      <span style={{ flex: 1, textAlign: 'right', fontWeight: isOrphan ? 700 : 500 }}>
        {isOrphan
          ? '⚠ ' + value + ' (حذف‌شده)'
          : current
            ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {current.icon && <span style={{ display: 'inline-flex' }}>{current.icon}</span>}
                    <span>{current.label}</span>
                  </span>
                )
            : (placeholder || '— انتخاب کنید —')}
      </span>
    </button>
  );

  const listView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '4px 4px 0',
        }}>پیش‌فرض‌ها</div>
      )}
      {options.map(o => {
        const selected = value === o.value;
        return (
          <button key={o.value} type="button"
            onClick={() => { onChange(o.value); closeAll(); }}
            style={{
              ...ROW,
              borderColor: selected ? 'var(--accent)' : 'var(--border)',
              background: selected
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 100%)'
                : ROW.background,
              boxShadow: ROW.boxShadow,
            }}>
            <span style={{
              ...ICON,
              background: selected
                ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 100%)'
                : ICON.background,
            }}>{typeof o.icon === 'string' ? o.icon : (o.icon || '•')}</span>
            <span style={{ flex: 1, fontWeight: selected ? 700 : 600 }}>{o.label}</span>
          </button>
        );
      })}

      {customs.length > 0 && (
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--muted)',
          letterSpacing: '.6px', padding: '10px 4px 0',
        }}>سفارشی</div>
      )}
      {customs.map(c => {
        const selected = value === c.name;
        const isHi = highlight === c.name;
        return (
          <div key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => { onChange(c.name); closeAll(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(c.name); closeAll(); } }}
            style={{
              ...ROW,
              padding: '10px 12px 10px 10px',
              gap: 10,
              borderColor: selected || isHi ? 'var(--accent)' : 'var(--border)',
              background: selected
                ? 'linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, transparent) 0%, color-mix(in srgb, var(--accent) 4%, transparent) 100%)'
                : ROW.background,
              boxShadow: ROW.boxShadow,
            }}>
            <span style={{
              ...ICON,
              background: selected
                ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, transparent) 0%, color-mix(in srgb, var(--accent) 10%, transparent) 100%)'
                : ICON.background,
            }}>{c.icon}</span>
            <span style={{ flex: 1, fontWeight: selected ? 700 : 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
            <button type="button" aria-label="ویرایش" onClick={(e) => { e.stopPropagation(); openEdit(c.id); }} style={MINI}>✏️</button>
            <button type="button" aria-label="حذف" onClick={(e) => removeItem(e, c.id, c.name)} style={MINI}>🗑️</button>
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
            width: 54, height: 54,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, background: 'var(--input-bg)',
            borderRadius: 14, border: '1px solid var(--border)',
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
          <EmojiPickerInline value={formIcon} onPick={setFormIcon} />
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
        width: 34, height: 34,
        borderRadius: 'var(--r-md)',
        background: 'var(--accent)',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        fontWeight: 400,
        lineHeight: 1,
        fontFamily: 'inherit',
        boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 28%, transparent)',
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

  return (
    <>
      {undoData && (
        <UndoBar
          label={'«' + undoData.name + '» مخفی شد'}
          onUndo={() => { unhideOption(undoData.id); setUndoData(null); }}
          onDismiss={() => setUndoData(null)}
        />
      )}
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}
      <Modal
        open={open}
        onClose={view === 'form' ? backToList : closeAll}
        title={modalTitle}
        footer={modalFooter}
        headerAction={headerAction}
      >
        {view === 'form' ? formView : listView}
      </Modal>
    </>
  );
}

// ─── ایموجی inline ───
import { EMOJI_GROUPS } from '../data/emojis';

function EmojiPickerInline({ onPick, value }: { onPick: (e: string) => void; value?: string }) {
  const [tab, setTab] = useState(EMOJI_GROUPS[0].id);
  const g = EMOJI_GROUPS.find(x => x.id === tab) || EMOJI_GROUPS[0];
  return (
    <>
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {EMOJI_GROUPS.map(x => (
          <button key={x.id} type="button" onClick={() => setTab(x.id)} title={x.name}
            style={{
              padding: '6px 10px', fontSize: 18,
              borderRadius: 'var(--r-sm)',
              border: '1px solid ' + (tab === x.id ? 'var(--accent-border)' : 'var(--border)'),
              background: tab === x.id ? 'var(--accent-soft)' : 'transparent',
              cursor: 'pointer', flexShrink: 0,
            }}>
            {x.icon}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: 4 }}>
        {g.emojis.map(em => {
          const sel = value === em;
          return (
            <button key={em} type="button" onClick={() => onPick(em)}
              style={{
                padding: 8, fontSize: 22, lineHeight: 1,
                background: sel ? 'var(--accent-soft)' : 'var(--card-solid)',
                border: '1px solid ' + (sel ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 'var(--r-sm)', cursor: 'pointer',
              }}>
              {em}
            </button>
          );
        })}
      </div>
    </>
  );
}
