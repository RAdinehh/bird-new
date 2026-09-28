const KEY = 'pm-error-log';
const MAX = 100;

export interface LogEntry {
  id: string;
  time: string;
  type: string;
  message: string;
  stack: string;
  componentStack: string;
  url: string;
  userAgent: string;
}

/** خواندن لاگ‌ها */
export function getLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** افزودن لاگ */
export function logError(entry: Omit<LogEntry, 'id' | 'time' | 'url' | 'userAgent'>): void {
  try {
    const logs = getLogs();
    const newEntry: LogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      time: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    logs.unshift(newEntry);
    // حداکثر ۱۰۰ خط
    const trimmed = logs.slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch { /* ignore */ }
}

/** پاک کردن لاگ‌ها */
export function clearLogs(): void {
  localStorage.removeItem(KEY);
}

/** خروجی JSON */
export function exportLogs(): string {
  return JSON.stringify(getLogs(), null, 2);
}

/** تعداد لاگ‌ها */
export function logCount(): number {
  return getLogs().length;
}
