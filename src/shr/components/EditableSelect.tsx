import EmojiPicker from './EmojiPicker';
/**
 * EditableSelect.tsx — انتخاب‌گر با قابلیت افزودن/ویرایش/حذف
 *
 * از SelectSheetShell استفاده می‌کند (استاندارد مشترک):
 *   - هدر RTL: [عنوان] [+] [🔍] [✕]
 *   - سرگروه متمایز (سبز ملایم)
 *   - آیتم‌های مینیمال (بدون border، خط جداکننده)
 *   - اسکرول ایندیکیتور ۳ نقطه پالسی
 *   - ویرایش/حذف داخل آیتم‌های سفارشی
 *   - جستجو فقط اگه > ۵ آیتم
 */
import { OptionIcon } from './OptionIcon';
import { getGlobalFormat } from '../units/useFormat';


import { useState, useMemo } from 'react';
import { Btn, Field, Input, Modal } from './ui';
import { useCustomOptions, type CustomOption } from '../store/customOptions';
import { showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import SelectSheetShell, { SheetGroup, SheetItem } from './SelectSheetShell';
import { Package, Sparkles, Trash2, Pencil } from 'lucide-react';
export interface EditableOption {
  value: string;
  label: string;
  icon?: string | React.ReactNode;
  /** 🆕 اگه پر شه، آیکون از EquipmentIcon میاد */
  equipType?: string;
  /** 🆕 دسته برای رنگ IconBadge */
  category?: string;
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

const ACTION_BTN: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8,
  border: 'none', background: 'transparent',
  color: 'var(--muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
  transition: 'background .12s, color .12s',
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
  const [query, setQuery] = useState('');
  const [undoData, setUndoData] = useState<{ id: string; name: string } | null>(null);

  const { getByKey, addOption, updateOption, hideOption, unhideOption } = useCustomOptions();
  const customs = customKey ? getByKey(customKey) : [];

  const all: EditableOption[] = [
    ...options,
    ...customs.map(c => ({ value: c.name, label: c.name, icon: c.icon })),
  ];
  const current = all.find(o => o.value === value);
  const isOrphan = !!value && !current;

  // فیلتر جستجو
  const q = query.trim().toLowerCase();
  const filteredOptions = useMemo(
    () => q ? options.filter(o => o.label.toLowerCase().includes(q)) : options,
    [options, q],
  );
  const filteredCustoms = useMemo(
    () => q ? customs.filter(c => c.name.toLowerCase().includes(q)) : customs,
    [customs, q],
  );

  const totalItems = options.length + customs.length;
  /** آستانه: ۵ آیتم — کمتر = ساده، بیشتر = کامل */
  const useEnhancedUI = totalItems > 5;
  const searchable = useEnhancedUI;

  const resetForm = () => {
    setEditId(null);
    setFormName('');
    setFormIcon('🔧');
    setEmojiOpen(false);
  };

  const openAdd = () => { resetForm(); setView('form'); };

  const openEdit = (id: string) => {
    const c = customs.find(x => x.id === id);
    if (!c) return;
    setEditId(id);
    setFormName(c.name);
    setFormIcon(c.icon);
    setEmojiOpen(false);
    setView('form');
  };

  const backToList = () => { resetForm(); setView('list'); };

  const closeAll = () => {
    resetForm();
    setView('list');
    setQuery('');
    setOpen(false);
  };

  const saveItem = () => {
    const name = formName.trim();
    if (!name) return;
    if (editId) {
      updateOption(editId, { name, icon: formIcon });
    } else if (customKey) {
      addOption(customKey, name, formIcon);
    }
    resetForm();
    setView('list');
  };

  const removeItem = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const count = usageCheck ? usageCheck(name) : 0;
    const message = count > 0
      ? `«${name}» در ${count} مورد استفاده شده.\n\nاگه حذف کنی، از لیست غیب می‌شه ولی داده‌های قبلی دست‌نخورده می‌مونن.`
      : `«${name}» جای دیگه‌ای استفاده نشده.\n\nحذف بشه؟`;
    const ok = await showConfirmAsync('حذف آیتم', message, { danger: true });
    if (!ok) return;
    hideOption(id);
    setUndoData({ id, name });
    setTimeout(() => {
      setUndoData(cur => cur && cur.id === id ? null : cur);
    }, 5000);
  };

  // ═══ Trigger ═══
  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        width: '100%', height: 38, textAlign: 'right', padding: '0 12px',
        background: 'var(--input-bg)',
        border: '1px solid ' + (isOrphan ? 'var(--warn)' : 'var(--border)'),
        borderRadius: 'var(--r-md)',
        color: isOrphan ? 'var(--warn)' : (current ? 'var(--text)' : 'var(--muted)'),
        fontSize: 'var(--fs-base)', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 8,
        boxSizing: 'border-box',
      }}
    >
      <span style={{ flex: 1, textAlign: 'right', fontWeight: isOrphan ? 700 : 400, display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {isOrphan ? (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {'⚠ ' + value + ' (حذف‌شده)'}
          </span>
        ) : current ? (
          <>
            {current.icon ? <OptionIcon icon={current.icon as any} size={20} /> : null}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{current.label}</span>
          </>
        ) : (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {placeholder || '— انتخاب —'}
          </span>
        )}
      </span>
      <span style={{ color: 'var(--muted)', flexShrink: 0, display: 'inline-flex' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </button>
  );

  // ═══ List view ═══
  // حالت ≤ ۵: لیست تخت • حالت > ۵: گروه‌بندی‌شده
  const renderItems = (
    opts: EditableOption[],
    customsList: CustomOption[],
  ) => {
    if (!useEnhancedUI || opts.length === 0 || customsList.length === 0) {
      // لیست تخت
      return (
        <>
          {opts.map(o => (
            <SheetItem
              key={o.value}
              icon={o.icon}
              equipType={o.equipType}
              category={o.category}
              title={o.label}
              selected={value === o.value}
              onClick={() => { onChange(o.value); closeAll(); }}
            />
          ))}
          {customsList.map(c => (
            <SheetItem
              key={c.id}
              icon={c.icon}
              title={c.name}
              selected={value === c.name}
              onClick={() => { onChange(c.name); closeAll(); }}
              actions={renderActions(c)}
            />
          ))}
        </>
      );
    }
    // گروه‌بندی‌شده
    return (
      <>
        {opts.length > 0 && (
          <SheetGroup title="پیش‌فرض‌ها" icon={<Package size={14} />} count={opts.length}>
            {opts.map(o => (
              <SheetItem
                key={o.value}
                icon={o.icon}
                equipType={o.equipType}
                category={o.category}
                title={o.label}
                selected={value === o.value}
                onClick={() => { onChange(o.value); closeAll(); }}
              />
            ))}
          </SheetGroup>
        )}
        {customsList.length > 0 && (
          <SheetGroup title="سفارشی" icon={<Sparkles size={14} />} count={customsList.length}>
            {customsList.map(c => (
              <SheetItem
                key={c.id}
                icon={c.icon}
                title={c.name}
                selected={value === c.name}
                onClick={() => { onChange(c.name); closeAll(); }}
                actions={renderActions(c)}
              />
            ))}
          </SheetGroup>
        )}
      </>
    );
  };

  const renderActions = (c: CustomOption) => (
    <>
      <button type="button" aria-label="حذف" title="حذف"
        onClick={(e) => removeItem(e, c.id, c.name)}
        style={{
          width: 34, height: 34, borderRadius: 10,
          border: 'none',
          background: 'var(--danger-soft)',
          color: 'var(--danger)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, flexShrink: 0,
        }}
      >
        <Trash2 size={17} strokeWidth={2.2} />
      </button>
      <button type="button" aria-label="ویرایش" title="ویرایش"
        onClick={(e) => { e.stopPropagation(); openEdit(c.id); }}
        style={{
          width: 34, height: 34, borderRadius: 10,
          border: 'none',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, flexShrink: 0,
        }}
      >
        <Pencil size={17} strokeWidth={2.2} />
      </button>
    </>
  );

  const listView = (
    <>
      {filteredOptions.length === 0 && filteredCustoms.length === 0 ? (
        <div style={{
          padding: '32px 12px', textAlign: 'center',
          color: 'var(--muted)', fontSize: 'var(--fs-base)',
        }}>
          <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>🔍</div>
          <div>چیزی پیدا نشد</div>
        </div>
      ) : (
        renderItems(filteredOptions, filteredCustoms)
      )}
    </>
  );

  // ═══ Form view ═══
  const formView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Field label="نام">
        <Input
          placeholder="نام"
          value={formName}
          onChange={e => setFormName(e.target.value)}
        />
      </Field>
      <Field label="آیکن">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 54, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--input-bg)', borderRadius: 14, border: '1px solid var(--border)' }}><OptionIcon icon={formIcon as any} size={28} /></div>
          <Btn onClick={() => setEmojiOpen(o => !o)} style={{ flex: 1 }}>
            {emojiOpen ? 'بستن ایموجی‌ها' : 'انتخاب از ایموجی‌ها'}
          </Btn>
        </div>
      </Field>
      <EmojiPicker open={emojiOpen} onClose={() => setEmojiOpen(false)} onPick={setFormIcon} title="انتخاب آیکون" />
    </div>
  );

  // ═══ عنوان و زیرعنوان ═══
  const sheetTitle = view === 'form'
    ? (editId ? 'ویرایش مورد' : 'افزودن مورد جدید')
    : (label || 'انتخاب');

  const subtitle = view === 'list' && searchable
    ? `${getGlobalFormat().count(all.length)} مورد`
    : undefined;

  return (
    <>
      {undoData && (
        <UndoBar
          label={`«${undoData.name}» مخفی شد`}
          onUndo={() => { unhideOption(undoData.id); setUndoData(null); }}
          onDismiss={() => setUndoData(null)}
        />
      )}
      {label ? <Field label={label} required={required} error={error}>{trigger}</Field> : trigger}
      <SelectSheetShell
        open={open}
        onClose={view === 'form' ? backToList : closeAll}
        title={sheetTitle}
        subtitle={subtitle}
        onAdd={customKey && view === 'list' ? openAdd : undefined}
        searchable={view === 'list' && searchable}
        searchNode={
          <Input
            placeholder="جستجو..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        }
        footer={view === 'form' ? (
          <>
            <Btn variant="primary" onClick={saveItem} disabled={!formName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
            <Btn onClick={backToList} style={{ flex: 1 }}>لغو</Btn>
          </>
        ) : undefined}
      >
        {view === 'form' ? formView : listView}
      </SelectSheetShell>
    </>
  );
}

// ═══ helper ═══

// ═══ Emoji Picker Inline ═══
