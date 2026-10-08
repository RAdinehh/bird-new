/**
 * RestoreModal — مودال بازیابی پشتیبان
 */
import { Btn, BtnRow, Field, Modal, Select } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  preview: any;
  previewTotalRecords: number;
  mergeMode: 'replace' | 'merge';
  setMergeMode: (v: 'replace' | 'merge') => void;
  onConfirm: () => void;
}

export default function RestoreModal({ open, onClose, preview, previewTotalRecords, mergeMode, setMergeMode, onConfirm }: Props) {
  return (
    <>
      <Modal
        open={open}
        onClose={() => { onClose() }}
        title="بازیابی پشتیبان"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={onConfirm}>بازیابی کن</Btn>
            <Btn onClick={() => { onClose() }}>لغو</Btn>
          </BtnRow>
        }
      >
        {preview ? (
          <>
            <div style={{
              padding: 'var(--pad-comfy)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              fontSize: 'var(--fs-sm)',
              marginBottom: 12,
            }}>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>نسخه فایل</div>
                <div style={{ fontWeight: 700 }}>{toFa(preview.version)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>نسخه ساختار</div>
                <div style={{ fontWeight: 700 }}>{toFa(preview.schemaVersion)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>تاریخ</div>
                <div style={{ fontWeight: 700 }}>{preview.exportedAt.slice(0, 10)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>تعداد رکورد</div>
                <div style={{ fontWeight: 700 }}>{toFa(previewTotalRecords)}</div>
              </div>
            </div>

            <Field label="روش بازیابی">
              <Select value={mergeMode} onChange={e => setMergeMode(e.target.value as 'replace' | 'merge')}>
                <option value="merge">➕ ادغام با داده‌های فعلی</option>
                <option value="replace">🔁 جایگزینی کامل (پاک کردن فعلی)</option>
              </Select>
            </Field>

            <div style={{
              padding: 'var(--pad-normal)',
              background: 'var(--warn-soft)',
              border: '1px solid var(--warn)',
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--warn)',
              lineHeight: 1.7,
              marginTop: 12,
            }}>
              {mergeMode === 'merge'
                ? '➕ داده‌های جدید به داده‌های فعلی اضافه می‌شوند — رکوردهای تکراری بر اساس شناسه ادغام می‌شوند.'
                : '🔁 تمام داده‌های فعلی پاک می‌شوند و با فایل پشتیبان جایگزین می‌شوند.'}
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}
