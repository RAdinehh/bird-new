/**
 * تست useFormat — تغییر تنظیمات باید فوری نمایش رو عوض کنه
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormat } from '../shr/units/useFormat';
import { useSet } from '../mod/set/store';
import { DEFAULT_UNITS } from '../shr/units';

describe('useFormat — عدد', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('عدد صحیح با جداکننده فارسی', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.int(12500000)).toBe('۱۲٬۵۰۰٬۰۰۰');
  });

  it('عدد با اعشار ۲ رقم', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.num(1234.56)).toBe('۱٬۲۳۴٫۵۶');
  });

  it('تغییر به انگلیسی → فوری عوض میشه', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.int(1234)).toBe('۱٬۲۳۴');

    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, numberFormat: 'en' } });
    });

    expect(result.current.int(1234)).toBe('1,234');
  });

  it('تغییر اعشار → فوری', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.num(12.345)).toBe('۱۲٫۳۵'); // ۲ رقم

    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, decimals: 4 } });
    });

    expect(result.current.num(12.345)).toBe('۱۲٫۳۴۵۰');
  });

  it('جداکننده هزار = فاصله', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, thousandSep: 'space' } });
    });
    expect(result.current.int(1234567)).toBe('۱ ۲۳۴ ۵۶۷');
  });

  it('null → —', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.num(null)).toBe('—');
    expect(result.current.num(undefined)).toBe('—');
    expect(result.current.num(NaN)).toBe('—');
  });
});

describe('useFormat — پول', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('تومان پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.money(5000000)).toBe('۵٬۰۰۰٬۰۰۰ تومان');
  });

  it('تغییر به ریال (×۱۰)', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, currency: 'rial' } });
    });
    expect(result.current.money(5000000)).toBe('۵۰٬۰۰۰٬۰۰۰ ریال');
  });

  it('تغییر به دلار با نرخ 200k', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({
        units: { ...DEFAULT_UNITS, currency: 'usd', usdRate: 200000 },
      });
    });
    expect(result.current.money(5000000)).toBe('۲۵ $');
  });

  it('تغییر نرخ دلار → فوری عوض', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({
        units: { ...DEFAULT_UNITS, currency: 'usd', usdRate: 200000 },
      });
    });
    expect(result.current.money(5000000)).toBe('۲۵ $');

    act(() => {
      useSet.setState({
        units: { ...DEFAULT_UNITS, currency: 'usd', usdRate: 250000 },
      });
    });
    expect(result.current.money(5000000)).toBe('۲۰ $');
  });
});

describe('useFormat — دما', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('سلسیوس پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.temp(32)).toBe('۳۲٫۰°C');
  });

  it('تغییر به فارنهایت', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, temperature: 'f' } });
    });
    expect(result.current.temp(0)).toBe('۳۲٫۰°F');
    expect(result.current.temp(100)).toBe('۲۱۲٫۰°F');
  });
});

describe('useFormat — وزن (پایه: گرم)', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('کیلوگرم پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.weight(2500)).toBe('۲٫۵۰ kg');
  });

  it('تغییر به گرم', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, weight: 'g' } });
    });
    expect(result.current.weight(2500)).toBe('۲٬۵۰۰٫۰۰ g');
  });

  it('تغییر به تن', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, weight: 'ton' } });
    });
    expect(result.current.weight(2_000_000)).toBe('۲٫۰۰ t');
  });
});

describe('useFormat — حجم (پایه: ml)', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('لیتر پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.volume(5000)).toBe('۵٫۰۰ L');
  });

  it('تغییر به سی‌سی', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, volume: 'cc' } });
    });
    expect(result.current.volume(0.5)).toBe('۰٫۵۰ cc');
  });

  it('تغییر به میلی‌لیتر', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, volume: 'ml' } });
    });
    expect(result.current.volume(0.5)).toBe('۰٫۵۰ ml');
  });
});

describe('useFormat — طول (پایه: cm)', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('سانتی‌متر پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.length(12)).toBe('۱۲٫۰۰ cm');
  });

  it('تغییر به متر', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, length: 'm' } });
    });
    expect(result.current.length(300)).toBe('۳٫۰۰ m');
  });
});

describe('useFormat — مساحت (پایه: m²)', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('مترمربع پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.area(100)).toBe('۱۰۰٫۰۰ m²');
  });

  it('تغییر به هکتار', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, area: 'ha' } });
    });
    expect(result.current.area(20000)).toBe('۲٫۰۰ ha');
  });
});

describe('useFormat — زمان (پایه: ثانیه)', () => {
  beforeEach(() => {
    useSet.setState({ units: { ...DEFAULT_UNITS } });
  });

  it('ساعت پیش‌فرض', () => {
    const { result } = renderHook(() => useFormat());
    expect(result.current.time(3600)).toBe('۱ س');
  });

  it('تغییر به روز', () => {
    const { result } = renderHook(() => useFormat());
    act(() => {
      useSet.setState({ units: { ...DEFAULT_UNITS, time: 'day' } });
    });
    expect(result.current.time(86400)).toBe('۱ روز');
  });
});
