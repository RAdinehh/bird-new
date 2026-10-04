/**
 * useDraftAutosave — ذخیره خودکار پیش‌نویس فرم در localStorage
 */
import { useState, useEffect, useRef, useCallback } from 'react';

interface Options<T> {
  key: string;
  data: T;
  enabled: boolean;
  debounceMs?: number;
  shouldSave?: (data: T) => boolean;
}

export type DraftStatus = 'idle' | 'saving' | 'saved';
type Status = DraftStatus;

export interface DraftResult<T> {
  status: Status;
  hasDraft: boolean;
  clearDraft: () => void;
  restoreDraft: () => T | null;
  savedAt: number | null;
}

export function useDraftAutosave<T>({
  key,
  data,
  enabled,
  debounceMs = 800,
  shouldSave,
}: Options<T>): DraftResult<T> {
  const [status, setStatus] = useState<Status>('idle');
  const [hasDraft, setHasDraft] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastSerialized = useRef<string>('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      setHasDraft(!!raw);
    } catch { /* silent */ }
  }, [key]);

  useEffect(() => {
    if (!enabled) return;
    if (shouldSave && !shouldSave(data)) return;

    let serialized: string;
    try {
      serialized = JSON.stringify(data);
    } catch { return; }

    if (serialized === lastSerialized.current) return;
    lastSerialized.current = serialized;

    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      try {
        setStatus('saving');
        localStorage.setItem(key, serialized);
        setStatus('saved');
        setHasDraft(true);
        setSavedAt(Date.now());
        window.setTimeout(() => setStatus(s => s === 'saved' ? 'idle' : s), 2000);
      } catch {
        setStatus('idle');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [key, data, enabled, debounceMs, shouldSave]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setStatus('idle');
      setSavedAt(null);
      lastSerialized.current = '';
    } catch { /* silent */ }
  }, [key]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }, [key]);

  return { status, hasDraft, clearDraft, restoreDraft, savedAt };
}
