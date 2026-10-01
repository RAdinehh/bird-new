/**
 * auditLog.ts — لاگ فعالیت کاربر
 * ثبت هر عملیات مهم: add/update/delete/export/import
 */
import { useSet } from '../../mod/set/store';

const KEY = 'pm-audit-log';
const DEFAULT_MAX = 100;

export type AuditAction = 'add' | 'update' | 'delete' | 'export' | 'import' | 'restore' | 'other';

export interface AuditEntry {
  id: string;
  time: string;
  action: AuditAction;
  module: string;
  summary: string;
  details?: string;
}

function _uuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function _getMax(): number {
  try {
    const s: any = useSet.getState();
    return s?.auditLog?.maxEntries || DEFAULT_MAX;
  } catch { return DEFAULT_MAX; }
}

function _isEnabled(): boolean {
  try {
    const s: any = useSet.getState();
    return s?.auditLog?.enabled !== false;
  } catch { return true; }
}

/** خواندن لاگ‌ها */
export function getAuditLogs(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

/** ثبت یک فعالیت */
export function logAction(
  action: AuditAction,
  module: string,
  summary: string,
  details?: string
): void {
  if (!_isEnabled()) return;
  try {
    const entries = getAuditLogs();
    const entry: AuditEntry = {
      id: _uuid(),
      time: new Date().toISOString(),
      action,
      module,
      summary,
      details,
    };
    entries.unshift(entry);
    const max = _getMax();
    const trimmed = entries.slice(0, max);
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch { /* silent */ }
}

/** پاک کردن همه لاگ‌ها */
export function clearAuditLogs(): void {
  try { localStorage.removeItem(KEY); } catch { /* silent */ }
}

/** تعداد لاگ‌ها */
export function auditLogCount(): number {
  return getAuditLogs().length;
}

/** خروجی JSON */
export function exportAuditLogs(): string {
  return JSON.stringify(getAuditLogs(), null, 2);
}
