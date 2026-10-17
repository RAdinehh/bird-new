/**
 * FlockSourcePickers.tsx — انتخاب فاکتور خرید / هچ
 */
import { Field } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { F } from '../types-flocks';

interface Props {
  form: F;
  setForm: (updater: F | ((prev: F) => F)) => void;
  onOpenInvoicePicker: () => void;
  onOpenHatchPicker: () => void;
}

export default function FlockSourcePickers({ form, setForm, onOpenInvoicePicker, onOpenHatchPicker }: Props) {
  return (
    <>
      {form.source === 'purchase' && (
        <Field label="فاکتور خرید" hint="برای پر کردن خودکار، یک فاکتور انتخاب کنید">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={onOpenInvoicePicker}
              style={{
                width: '100%',
                height: 38,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '0 var(--sp-3)',
                paddingLeft: form.sourceInvoiceId ? 34 : 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-base)',
                color: form.sourceInvoiceId ? 'var(--text)' : 'var(--dim)',
                textAlign: 'right',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.sourceInvoiceId ? '📄 فاکتور ' + form.sourceInvoiceId.slice(0, 8) : '— انتخاب از فاکتور —'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {form.sourceInvoiceId && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, sourceInvoiceId: '', initialCount: '', currentCount: '', purchaseDate: '', purchasePrice: '' }))}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--danger)',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
                title="پاک کردن"
              >✕</button>
            )}
          </div>
        </Field>
      )}

      {form.source === 'hatch' && (
        <Field label="هچ (جوجه‌کشی)" hint="برای پر کردن خودکار، یک هچ انتخاب کنید">
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={onOpenHatchPicker}
              style={{
                width: '100%',
                height: 38,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: '0 var(--sp-3)',
                paddingLeft: form.hatchId ? 34 : 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-base)',
                color: form.hatchId ? 'var(--text)' : 'var(--dim)',
                textAlign: 'right',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.hatchId ? '🐣 هچ ' + toFa(form.hatchDate || '') : '— انتخاب از هچ —'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2.5">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {form.hatchId && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, hatchId: '', initialCount: '', currentCount: '', hatchDate: '' }))}
                style={{
                  position: 'absolute',
                  left: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 22,
                  height: 22,
                  background: 'var(--danger-soft)',
                  border: '1px solid rgba(239,68,68,.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 11,
                  color: 'var(--danger)',
                  fontFamily: 'inherit',
                  padding: 0,
                }}
                title="پاک کردن"
              >✕</button>
            )}
          </div>
        </Field>
      )}
    </>
  );
}
