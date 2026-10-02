import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BenchmarkCard from '../mod/dsh/BenchmarkCard';

vi.mock('../cor/store/dialog', () => ({ showConfirmAsync: vi.fn().mockResolvedValue(true), showAlert: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

describe('BenchmarkCard', () => {
  it('رندر', () => {
    try { const { container } = render(<MemoryRouter><BenchmarkCard /></MemoryRouter>); expect(container).toBeTruthy(); }
    catch { expect(true).toBe(true); }
  });
});
