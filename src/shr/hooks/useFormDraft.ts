/**
 * useFormDraft — ذخیره خودکار فرم در localStorage
 *
 * طبق FORM-RULES.md بند ۶ — «Auto-save Draft: هر ۳۰s در localStorage»
 *
 * استفاده:
 *   const draft = useFormDraft('brd-bird', form, setForm);
 *   // در save موفق: draft.clear();
 *
 * رفتار:
 *   - هنگام mount: اگه draft قبلی بود → setForm
 *   - هر بار form عوض شد: debounce ۳۰ ثانیه → ذخیره
 *   - draft.clear(): پاک کردن
 *   - draft.hasDraft(): بررسی وجود
 */

import { useEffect, useRef, useState } from 'react';
import { safeStorage } from '../utils/storage';

const PREFIX = 'pm-draft-';
const DEBOUNCE_MS = 30_000;

export interface UseFormDraftReturn<T> {
  /** پاک کردن draft */
  clear: () => void;
  /** آیا draft فعال داره؟ */
  hasDraft: boolean;
  /** زمان آخرین ذخیره */
  savedAt: number | null;
}

export function useFormDraft<T extends object>(
  key: string,
  form: T,
  setForm: (v: T) => void,
): UseFormDraftReturn<T> {
  const storageKey = PREFIX + key;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // بارگذاری draft در mount (فقط یک بار)
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const draft = safeStorage.getJSON<{ data: T; at: number } | null>(storageKey, null);
    if (draft && draft.data) {
      // فقط اگه draft معنی‌داره (خالی نباشه)
      const isEmpty = Object.values(draft.data as any).every(v => v === '' || v == null);
      if (!isEmpty) {
        setForm(draft.data);
        setHasDraft(true);
        setSavedAt(draft.at);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ذخیره خودکار با debounce
  useEffect(() => {
    if (!mountedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const isEmpty = Object.values(form as any).every(v => v === '' || v == null);
      if (isEmpty) return;

      const ok = safeStorage.setJSON(storageKey, { data: form, at: Date.now() });
      if (ok) {
        setHasDraft(true);
        setSavedAt(Date.now());
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, storageKey]);

  const clear = () => {
    safeStorage.remove(storageKey);
    setHasDraft(false);
    setSavedAt(null);
  };

  return { clear, hasDraft, savedAt };
}
