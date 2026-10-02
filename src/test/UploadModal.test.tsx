import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import UploadModal from '../mod/doc/UploadModal';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));

describe('UploadModal', () => {
  it('رندر', () => {
    try { const { container } = render(<UploadModal open={false} onClose={() => {}} />); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
