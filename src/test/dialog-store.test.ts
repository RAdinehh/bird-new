import { describe, it, expect, vi } from 'vitest';
import * as dialog from '../cor/store/dialog';

describe('dialog store', () => {
  it('exports موجودن', () => {
    expect(typeof dialog.showAlert).toBe('function');
    expect(typeof dialog.showConfirmAsync).toBe('function');
  });

  it('showConfirmAsync Promise برمیگردونه', () => {
    const p = dialog.showConfirmAsync('پیام');
    expect(p).toBeInstanceOf(Promise);
    // cleanup بدون انتظار طولانی
    setTimeout(() => {
      try { dialog.useDialog.getState().close?.(); } catch {}
    }, 10);
  });
});
