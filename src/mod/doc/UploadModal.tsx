import { useState, useRef } from 'react';
import { addFile, fileCategory, CATEGORY_LABEL, LINKED_TYPE_LABEL, formatSize, type DocCategory } from './store';
import { Btn, BtnRow, Field, Input, Modal, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  prefillType?: string;
  prefillId?: string;
}

const ACCEPT = 'image/*,application/pdf,audio/*,video/*,.xlsx,.xls,.csv';

export default function UploadModal({ open, onClose, onUploaded, prefillType, prefillId }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocCategory>('image');
  const [linkedType, setLinkedType] = useState(prefillType || 'none');
  const [linkedId, setLinkedId] = useState(prefillId || '');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setFile(null);
    setCategory('image');
    setLinkedType(prefillType || 'none');
    setLinkedId(prefillId || '');
    setTags('');
    setNotes('');
    setErr('');
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setCategory(fileCategory(f.type, f.name));
      setErr('');
    }
  };

  const handleUpload = async () => {
    if (file === null) { setErr('لطفاً یک فایل انتخاب کنید'); return; }
    if (file.size > 10 * 1024 * 1024) {
      setErr('حجم فایل بیشتر از ۱۰ مگابایت است');
      return;
    }

    setUploading(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
      await addFile(file, category, linkedType, linkedId, tagList, notes);
      reset();
      onUploaded();
      onClose();
    } catch (e) {
      setErr('خطا در ذخیره‌ی فایل');
    }
    setUploading(false);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title="📎 افزودن فایل"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleUpload} disabled={uploading || file === null}>
            {uploading ? 'در حال ذخیره...' : 'ذخیره'}
          </Btn>
          <Btn onClick={handleCancel}>لغو</Btn>
        </BtnRow>
      }
    >
      {/* انتخاب فایل */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        style={{ display: 'none' }}
        onChange={handleSelect}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        style={{
          padding: '24px 16px',
          background: 'var(--input-bg)',
          border: '2px dashed var(--accent-border)',
          borderRadius: 'var(--r-lg)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}
      >
        {file === null ? (
          <>
            <div style={{ fontSize: 'var(--fs-hero)' }}>📎</div>
            <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--accent)' }}>
              برای انتخاب فایل بزنید
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              تصویر، PDF، صدا، ویدیو یا Excel — حداکثر ۱۰ مگابایت
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 'var(--fs-hero)' }}>
              {category === 'image' ? '🖼' : category === 'pdf' ? '📄' : category === 'audio' ? '🎵' : category === 'video' ? '🎬' : category === 'excel' ? '📊' : '📎'}
            </div>
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)',
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {file.name}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              {formatSize(file.size)} · {CATEGORY_LABEL[category]}
            </div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginTop: 4 }}>
              برای تغییر، دوباره بزنید
            </div>
          </>
        )}
      </button>

      {/* دسته */}
      <Field label="دسته‌ی فایل">
        <Select value={category} onChange={e => setCategory(e.target.value as DocCategory)}>
          {(Object.keys(CATEGORY_LABEL) as DocCategory[]).map(c => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </Select>
      </Field>

      {/* اتصال به رکورد */}
      <Field label="اتصال به" hint="اختیاری — فایل را به یک رکورد وصل کن">
        <Select value={linkedType} onChange={e => setLinkedType(e.target.value)}>
          {Object.entries(LINKED_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </Field>

      {linkedType !== 'none' ? (
        <Field label="شناسه‌ی رکورد" hint="اگر نمی‌دانید خالی بگذارید">
          <Input
            value={linkedId}
            onChange={e => setLinkedId(e.target.value)}
            placeholder="شناسه رکورد"
            dir="ltr"
          />
        </Field>
      ) : null}

      {/* برچسب‌ها */}
      <Field label="برچسب‌ها" hint="با کاما جدا کن: فاکتور، رسید، ۱۴۰۵">
        <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="فاکتور، آذر ۱۴۰۵" />
      </Field>

      {/* یادداشت */}
      <Field label="یادداشت">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
      </Field>

      {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
    </Modal>
  );
}
