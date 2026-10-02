import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import {
  Section, SectionTitle, Row,
  FormGroup, FormSub, FormSubFirst,
  FormTabs, useFormGroups,
} from '../mod/dlg/helpers';

// ═══════════════════════════════════════════════
// Section
// ═══════════════════════════════════════════════
describe('Section', () => {
  it('title رندر میشه', () => {
    render(<Section title="عنوان"><div>x</div></Section>);
    expect(screen.getByText('عنوان')).toBeInTheDocument();
  });

  it('children رندر میشن', () => {
    render(<Section title="t"><span>child</span></Section>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════
// SectionTitle
// ═══════════════════════════════════════════════
describe('SectionTitle', () => {
  it('متن رندر میشه', () => {
    render(<SectionTitle>متن تست</SectionTitle>);
    expect(screen.getByText('متن تست')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════
// Row
// ═══════════════════════════════════════════════
describe('Row', () => {
  it('label و value رندر میشن', () => {
    render(<Row l="عنوان" v="مقدار" />);
    expect(screen.getByText('عنوان:')).toBeInTheDocument();
    expect(screen.getByText('مقدار')).toBeInTheDocument();
  });

  it('warn رنگ رو عوض میکنه', () => {
    const { container } = render(<Row l="x" v="y" warn />);
    // warn → background: var(--warn-soft)
    expect(container.innerHTML).toContain('warn');
  });
});

// ═══════════════════════════════════════════════
// FormGroup
// ═══════════════════════════════════════════════
describe('FormGroup', () => {
  const make = (open = false, onToggle = vi.fn()) =>
    render(
      <FormGroup id="g1" icon="🏠" title="تست" sub="زیرعنوان" open={open} onToggle={onToggle}>
        <div>محتوا</div>
      </FormGroup>
    );

  it('title و sub رندر میشن', () => {
    make(false);
    expect(screen.getByText('تست')).toBeInTheDocument();
    expect(screen.getByText('زیرعنوان')).toBeInTheDocument();
  });

  it('وقتی open، sub مخفی میشه', () => {
    make(true);
    expect(screen.queryByText('زیرعنوان')).not.toBeInTheDocument();
  });

  it('کلیک روی header → onToggle', () => {
    const onToggle = vi.fn();
    make(false, onToggle);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('Enter → onToggle', () => {
    const onToggle = vi.fn();
    make(false, onToggle);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    expect(onToggle).toHaveBeenCalled();
  });

  it('Space → onToggle', () => {
    const onToggle = vi.fn();
    make(false, onToggle);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    expect(onToggle).toHaveBeenCalled();
  });

  it('aria-expanded درست', () => {
    make(true);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('id برای anchor', () => {
    const { container } = render(
      <FormGroup id="my-id" icon="x" title="t" open={true} onToggle={() => {}}>
        <div>x</div>
      </FormGroup>
    );
    expect(container.querySelector('#fg-my-id')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════
// FormSub / FormSubFirst
// ═══════════════════════════════════════════════
describe('FormSub', () => {
  it('title رندر میشه', () => {
    render(<FormSub title="زیربخش"><div>x</div></FormSub>);
    expect(screen.getByText('زیربخش')).toBeInTheDocument();
  });

  it('icon رندر میشه', () => {
    render(<FormSub icon="📋" title="زیر"><div>x</div></FormSub>);
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('children رندر', () => {
    render(<FormSub title="t"><span>inside</span></FormSub>);
    expect(screen.getByText('inside')).toBeInTheDocument();
  });
});

describe('FormSubFirst', () => {
  it('title رندر میشه', () => {
    render(<FormSubFirst title="اولین"><div>x</div></FormSubFirst>);
    expect(screen.getByText('اولین')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════
// FormTabs
// ═══════════════════════════════════════════════
describe('FormTabs', () => {
  const tabs = [
    { id: 'a', label: 'تب A', icon: '🏠' },
    { id: 'b', label: 'تب B' },
    { id: 'c', label: 'تب C' },
  ];

  it('همه تب‌ها رندر میشن', () => {
    render(<FormTabs tabs={tabs} active="a" onChange={() => {}} />);
    expect(screen.getByText('تب A')).toBeInTheDocument();
    expect(screen.getByText('تب B')).toBeInTheDocument();
    expect(screen.getByText('تب C')).toBeInTheDocument();
  });

  it('کلیک روی تب → onChange با id', () => {
    const onChange = vi.fn();
    render(<FormTabs tabs={tabs} active="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('تب B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('icon رندر میشه', () => {
    render(<FormTabs tabs={tabs} active="a" onChange={() => {}} />);
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════
// useFormGroups
// ═══════════════════════════════════════════════
describe('useFormGroups', () => {
  it('initial state درست', () => {
    const { result } = renderHook(() => useFormGroups({ a: true, b: false }));
    expect(result.current.groups.a).toBe(true);
    expect(result.current.groups.b).toBe(false);
  });

  it('toggle عوض میکنه', () => {
    const { result } = renderHook(() => useFormGroups({ a: false }));
    act(() => result.current.toggle('a'));
    expect(result.current.groups.a).toBe(true);
    act(() => result.current.toggle('a'));
    expect(result.current.groups.a).toBe(false);
  });

  it('openOnly فقط اون رو باز میکنه', () => {
    const { result } = renderHook(() => useFormGroups({ a: true, b: true, c: false }));
    act(() => result.current.openOnly('c'));
    expect(result.current.groups.a).toBe(false);
    expect(result.current.groups.b).toBe(false);
    expect(result.current.groups.c).toBe(true);
  });

  it('closeAll همه رو می‌بنده', () => {
    const { result } = renderHook(() => useFormGroups({ a: true, b: true }));
    act(() => result.current.closeAll());
    expect(Object.keys(result.current.groups)).toHaveLength(0);
  });

  it('openAll همه رو باز میکنه', () => {
    const { result } = renderHook(() => useFormGroups({ a: false, b: false }));
    act(() => result.current.openAll(['a', 'b']));
    expect(result.current.groups.a).toBe(true);
    expect(result.current.groups.b).toBe(true);
  });
});
