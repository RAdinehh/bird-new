/**
 * useFormErrors — الگوی «Reward Early, Punish Late»
 *
 * استاندارد جهانی (Material 3 + Fluent 2 + React Hook Form):
 *  - فیلد tازه باز: بدون خطا
 *  - فیلد touched (blur شده): خطا نشون بده
 *  - کاربر شروع کرد تایپ کنه: خطا فوراً پاک شه
 *  - کلیک ذخیره: همه خطاها ظاهر شن
 */
import { useState, useCallback } from 'react';

export interface UseFormErrorsResult {
  /** علامت‌گذاری فیلد به‌عنوان لمس‌شده */
  markTouched: (field: string) => void;
  /** ریست (openNew/openEdit) */
  reset: () => void;
  /** گرفتن پیام خطای فیلد (اگه باید نشون داده شه) */
  showError: (field: string) => string | undefined;
  /** آیا فیلد معتبر ئه؟ (لمس شده + بدون خطا) */
  isValid: (field: string) => boolean;
  /** علامت‌گذاری ذخیره‌ی ناموفق */
  attemptSave: () => void;
  /** آیا ذخیره زده شده؟ */
  saveAttempted: boolean;
}

export function useFormErrors(
  vErrors: Record<string, string>,
): UseFormErrorsResult {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  const [saveAttempted, setSaveAttempted] = useState(false);

  const markTouched = useCallback((field: string) => {
    setTouched(t => (t.has(field) ? t : new Set(t).add(field)));
  }, []);

  const reset = useCallback(() => {
    setTouched(new Set());
    setSaveAttempted(false);
  }, []);

  const attemptSave = useCallback(() => {
    setSaveAttempted(true);
  }, []);

  const showError = useCallback((field: string): string | undefined => {
    const err = vErrors[field];
    if (!err) return undefined;
    // ۱. بعد از ذخیره → همه خطاها
    if (saveAttempted) return err;
    // ۲. فیلد لمس نشده → هیچ خطایی
    if (!touched.has(field)) return undefined;
    // ۳. خطای «اجباری/خالی» → فقط بعد از save
    if (isRequiredError(err)) return undefined;
    // ۴. خطای محتوایی (max/min/type) → فوراً
    return err;
  }, [vErrors, touched, saveAttempted]);

  const isValid = useCallback((field: string): boolean => {
    // فیلد خالی → نه (چون چیز معتبری نداره)
    if (!touched.has(field) && !saveAttempted) return false;
    return !vErrors[field];
  }, [vErrors, touched, saveAttempted]);

  return { markTouched, reset, showError, attemptSave, saveAttempted, isValid };
}

/** 🆕 تشخیص خطاهای «فیلد خالی» (اجباری) vs «محتوایی» */
function isRequiredError(msg: string): boolean {
  return (
    msg.includes('اجباری') ||
    msg.includes('را وارد کنید') ||
    msg.includes('را انتخاب کنید') ||
    msg.includes('لطفاً')
  );
}
