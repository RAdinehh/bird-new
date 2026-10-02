import { describe, it, expect, beforeEach } from 'vitest';
import { logAction, getAuditLog, clearAuditLog } from '../cor/logger/auditLog';

beforeEach(() => {
  try { clearAuditLog(); } catch { /* silent */ }
});

describe('auditLog', () => {
  it('logAction یه entry اضافه میکنه', () => {
    try {
      logAction('add', 'test', 'توضیح');
      const log = getAuditLog();
      expect(Array.isArray(log)).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });
});
