import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ArchivePage from '../mod/arc/ArchivePage';
import {
  COMPARISON_UI_COPY,
  FIXTURE_ARCHIVED_SUMMARIES,
  FIXTURE_ACTIVE_FLOCKS,
  FIXTURE_ACTIVE_LOGS,
} from './comparisonFixtures';

vi.mock('../cor/storage/historyArchive', async () => {
  const actual = await vi.importActual<typeof import('../cor/storage/historyArchive')>(
    '../cor/storage/historyArchive'
  );
  return {
    ...actual,
    listFlockSummaries: vi.fn(async () => FIXTURE_ARCHIVED_SUMMARIES),
    listArchived: vi.fn(async () => []),
  };
});

vi.mock('../mod/flk/store', () => ({
  SOURCE_LABEL: { hatch: 'جوجه‌کشی', purchase: 'خرید' },
  getAgeDays: () => 25,
  calcCosts: () => ({ totalCost: 4000000, totalRevenue: 5000000, netProfit: 1000000 }),
  formatAge: (d: number) => `${d} روز`,
  useFlk: () => ({
    flocks: [
      ...FIXTURE_ACTIVE_FLOCKS,
      {
        id: 'arc-medium-ok',
        name: 'گله مرجع ۸۰ روزه',
        status: 'archived',
        breedId: 'hy-line',
        initialCount: 1000,
        startDate: '2026-01-01',
      },
    ],
    restore: vi.fn(),
    remove: vi.fn(),
  }),
}));

vi.mock('../mod/dlg/store', () => ({
  useDlg: () => ({
    logs: FIXTURE_ACTIVE_LOGS,
    restoreArchived: vi.fn(),
    restoreFlockLogs: vi.fn(),
  }),
}));

vi.mock('../mod/brd/store', () => ({
  useBrd: () => ({ birds: [], breeds: [] }),
}));

vi.mock('../mod/hal/store', () => ({
  useHal: () => ({ halls: [] }),
}));

vi.mock('../mod/whs/store', () => ({
  useWhs: () => ({ restoreMovements: vi.fn() }),
}));

vi.mock('../mod/tra/store', () => ({
  restoreTraInvoices: vi.fn(async () => 0),
}));

vi.mock('../mod/inc/store', () => ({
  restoreIncBatches: vi.fn(async () => 0),
}));

describe('ArchivePage - تست جامع UI/UX مقایسه گله‌ها بر اساس نسخه واحد', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ArchivePage />
      </MemoryRouter>
    );

  it('UX باز/بسته شدن پنل و نمایش سناریوی چندگله شامل گله فعال و آرشیوشده', async () => {
    renderPage();

    const toggleBtn = await screen.findByRole('button', {
      name: COMPARISON_UI_COPY.openBtn,
    });
    fireEvent.click(toggleBtn);

    expect(
      screen.getByRole('button', { name: COMPARISON_UI_COPY.closeBtn })
    ).toBeInTheDocument();

    // بررسی حضور گله فعال و گله‌های آرشیوشده در دکمه‌های انتخاب
    await waitFor(() => {
      expect(
        screen.getAllByText((content) => content.includes(COMPARISON_UI_COPY.activeTagSuffix))
          .length
      ).toBeGreaterThan(0);
    });

    // بررسی هشدار گله فعال و وضعیت‌های کامل بودن داده
    expect(
      screen.getAllByText((_, el) =>
        Boolean(el?.textContent?.includes(COMPARISON_UI_COPY.activeWarningSubstring))
      ).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(COMPARISON_UI_COPY.partialBadge).length).toBeGreaterThan(0);
  });

  it('UX کاهش انتخاب به کمتر از ۲ گله و پیام راهنما، و تغییر گله مرجع (Baseline)', async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole('button', { name: COMPARISON_UI_COPY.openBtn })
    );

    await waitFor(() => {
      expect(screen.getByLabelText(COMPARISON_UI_COPY.baselineLabel)).toBeInTheDocument();
    });

    // تغییر گله مرجع از سلکت
    const selectEl = screen.getByLabelText(
      COMPARISON_UI_COPY.baselineLabel
    ) as HTMLSelectElement;
    fireEvent.change(selectEl, { target: { value: 'arc-short-partial' } });
    expect(selectEl.value).toBe('arc-short-partial');

    // خروج گله‌ها از انتخاب تا کمتر از ۲ مورد باقی بماند
    const toggleChips = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.textContent?.includes('گله مرجع ۸۰ روزه') ||
          b.textContent?.includes('گله کوتاه ۳۰ روزه ناقص') ||
          b.textContent?.includes('گله بلند ۱۴۵ روزه') ||
          b.textContent?.includes('گله در حال پرورش')
      );

    for (const chip of toggleChips.slice(0, 3)) {
      fireEvent.click(chip);
    }

    expect(screen.getByText(COMPARISON_UI_COPY.minTwoHint)).toBeInTheDocument();
  });
});
