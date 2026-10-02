import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BirdsPage from '../mod/brd/BirdsPage';
import { useBrd } from '../mod/brd/store';

vi.mock('../cor/store/dialog', () => ({
  showConfirmAsync: vi.fn().mockResolvedValue(true),
  showAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../cor/store/toast', () => ({ showToast: vi.fn() }));
vi.mock('../cor/logger/auditLog', () => ({ logAction: vi.fn() }));

// helper: با id معتبر
const makeBird = (o: any = {}) => ({
  id: 'b-' + Math.random().toString(36).slice(2, 9),
  name: 'مرغ', nameEn: 'Chicken', cycleDays: 21, fcrStandard: 1.6,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

function expandCard(title: string) {
  const btn = screen.getByLabelText(`باز کردن ${title}`);
  fireEvent.click(btn);
}

beforeEach(() => {
  useBrd.setState({ birds: [], breeds: [] });
  vi.clearAllMocks();
});

describe('BirdsPage — حالت خالی', () => {
  it('پیام خالی', () => {
    render(<BirdsPage />);
    expect(screen.getByText('هنوز پرنده‌ای اضافه نکرده‌اید')).toBeInTheDocument();
  });
  it('دکمه افزودن', () => {
    render(<BirdsPage />);
    expect(screen.getByText('+ افزودن پرنده')).toBeInTheDocument();
  });
});

describe('BirdsPage — نمایش لیست', () => {
  it('پرنده‌ها دیده میشن', () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' }), makeBird({ name: 'بوقلمون' })] as any });
    render(<BirdsPage />);
    expect(screen.getByText('مرغ')).toBeInTheDocument();
    expect(screen.getByText('بوقلمون')).toBeInTheDocument();
  });

  it('badge نژاد صفر', () => {
    useBrd.setState({ birds: [makeBird()] as any });
    render(<BirdsPage />);
    expect(screen.getByText(/۰ نژاد/)).toBeInTheDocument();
  });

  it('با ۲ نژاد → badge ۲', () => {
    const bid = 'b1';
    useBrd.setState({
      birds: [makeBird({ id: bid })] as any,
      breeds: [
        { id: 'br1', birdId: bid, name: 'لگهورن', fcr: 1.5 } as any,
        { id: 'br2', birdId: bid, name: 'پلیموث', fcr: 1.7 } as any,
      ],
    });
    render(<BirdsPage />);
    expect(screen.getByText(/۲ نژاد/)).toBeInTheDocument();
  });

  it('cycleDays نمایش', () => {
    useBrd.setState({ birds: [makeBird({ cycleDays: 42 })] as any });
    render(<BirdsPage />);
    expect(screen.getAllByText(/۴۲/).length).toBeGreaterThan(0);
  });

  it('fcr نمایش', () => {
    useBrd.setState({ birds: [makeBird({ fcrStandard: 1.8 })] as any });
    render(<BirdsPage />);
    expect(screen.getAllByText(/۱[\.٫]۸/).length).toBeGreaterThan(0);
  });
});

describe('BirdsPage — افزودن', () => {
  it('باز شدن Modal', () => {
    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    expect(screen.getByText('افزودن پرنده')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('مثلاً — مرغ')).toBeInTheDocument();
  });

  it('پر کردن + ذخیره → اضافه میشه', async () => {
    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ'), { target: { value: 'اردک' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => {
      expect(useBrd.getState().birds).toHaveLength(1);
    });
    expect(useBrd.getState().birds[0].name).toBe('اردک');
  });

  it('نام خالی → ذخیره نشه', async () => {
    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    fireEvent.click(screen.getByText('ذخیره'));
    await new Promise(r => setTimeout(r, 50));
    expect(useBrd.getState().birds).toHaveLength(0);
  });

  it('لغو → بسته میشه', async () => {
    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    fireEvent.click(screen.getByText('لغو'));
    await waitFor(() => {
      expect(screen.queryByText('افزودن پرنده')).not.toBeInTheDocument();
    });
  });

  it('نام تکراری → showAlert', async () => {
    const { showAlert } = await import('../cor/store/dialog');
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });

    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ'), { target: { value: 'مرغ' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => expect(showAlert).toHaveBeenCalled());
  });

  it('نام جدید → ذخیره بدون هشدار', async () => {
    const { showAlert } = await import('../cor/store/dialog');
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });

    render(<BirdsPage />);
    fireEvent.click(screen.getByText('+ افزودن پرنده'));
    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ'), { target: { value: 'اردک' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => expect(useBrd.getState().birds).toHaveLength(2));
    expect(showAlert).not.toHaveBeenCalled();
  });
});

describe('BirdsPage — Expand / ویرایش / حذف', () => {
  it('expand → مشخصات', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ', nameEn: 'Chicken' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');

    await waitFor(() => expect(screen.getByText(/مشخصات کامل/)).toBeInTheDocument());
    expect(screen.getByText('نام انگلیسی:')).toBeInTheDocument();
  });

  it('expand → دکمه‌ها', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => {
      expect(screen.getByText('ویرایش')).toBeInTheDocument();
      expect(screen.getByText('حذف')).toBeInTheDocument();
    });
  });

  it('نمایش نژادها', async () => {
    const bid = 'b1';
    useBrd.setState({
      birds: [makeBird({ id: bid, name: 'مرغ' })] as any,
      breeds: [{ id: 'br1', birdId: bid, name: 'لگهورن', fcr: 1.5 } as any],
    });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText(/لگهورن/)).toBeInTheDocument());
  });

  it('کلیک ویرایش → Modal', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('ویرایش')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ویرایش'));

    await waitFor(() => expect(screen.getByText('ویرایش پرنده')).toBeInTheDocument());
  });

  it('ویرایش + save → آپدیت', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'قدیم' })] as any });
    render(<BirdsPage />);
    expandCard('قدیم');
    await waitFor(() => expect(screen.getByText('ویرایش')).toBeInTheDocument());
    fireEvent.click(screen.getByText('ویرایش'));

    await waitFor(() => expect(screen.getByText('ویرایش پرنده')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('مثلاً — مرغ'), { target: { value: 'جدید' } });
    fireEvent.click(screen.getByText('ذخیره'));

    await waitFor(() => expect(useBrd.getState().birds[0].name).toBe('جدید'));
  });

  it('کلیک حذف → Modal تأیید', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));

    await waitFor(() => expect(screen.getByText('حذف پرنده')).toBeInTheDocument());
  });

  it('تأیید حذف → پاک میشه', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));
    await waitFor(() => expect(screen.getByText('حذف کن')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف کن'));

    await waitFor(() => expect(useBrd.getState().birds).toHaveLength(0));
  });

  it('لغو حذف → باقی میمونه', async () => {
    useBrd.setState({ birds: [makeBird({ name: 'مرغ' })] as any });
    render(<BirdsPage />);
    expandCard('مرغ');
    await waitFor(() => expect(screen.getByText('حذف')).toBeInTheDocument());
    fireEvent.click(screen.getByText('حذف'));
    await waitFor(() => expect(screen.getByText('لغو')).toBeInTheDocument());
    fireEvent.click(screen.getByText('لغو'));

    await new Promise(r => setTimeout(r, 50));
    expect(useBrd.getState().birds).toHaveLength(1);
  });
});
