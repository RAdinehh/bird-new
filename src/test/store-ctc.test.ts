import { describe, it, expect, beforeEach } from 'vitest';
import { useCtc, ROLE_LABEL, ROLE_COLOR } from '../mod/ctc/store';

// helper
const makeContact = () => ({
  name: 'احمد رضایی',
  phone: '09123456789',
  phone2: '',
  email: 'a@b.com',
  address: 'تهران',
  city: 'تهران',
  nationalId: '1234567890',
  roles: ['customer'] as const,
  notes: '',
  customerType: '',
  customerTypes: ['wholesale'],
  trustScore: 8,
  defaultDiscount: 5,
  supplierTypes: [],
  position: '',
  startDate: '',
  salaryType: 'monthly',
  salaryAmount: null,
  insurance: false,
});

beforeEach(() => {
  // reset store
  useCtc.setState({ contacts: [] });
});

describe('useCtc — مخاطبین', () => {
  it('مقدار اولیه خالی', () => {
    expect(useCtc.getState().contacts).toEqual([]);
  });

  it('add → مخاطب جدید با id اضافه میکنه', () => {
    useCtc.getState().add(makeContact() as any);
    const c = useCtc.getState().contacts;
    expect(c).toHaveLength(1);
    expect(c[0].id).toBeTruthy();
    expect(c[0].name).toBe('احمد رضایی');
    expect(c[0].createdAt).toBeTruthy();
    expect(c[0].updatedAt).toBeTruthy();
  });

  it('add چند تا → همه اضافه میشن', () => {
    const s = useCtc.getState();
    s.add({ ...makeContact(), name: 'A' } as any);
    s.add({ ...makeContact(), name: 'B' } as any);
    s.add({ ...makeContact(), name: 'C' } as any);
    expect(useCtc.getState().contacts).toHaveLength(3);
    expect(useCtc.getState().contacts.map(c => c.name)).toEqual(['A', 'B', 'C']);
  });

  it('add → id یکتا', () => {
    const s = useCtc.getState();
    s.add(makeContact() as any);
    s.add(makeContact() as any);
    const ids = useCtc.getState().contacts.map(c => c.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('update → فقط هدف رو عوض میکنه', () => {
    const s = useCtc.getState();
    s.add({ ...makeContact(), name: 'A' } as any);
    s.add({ ...makeContact(), name: 'B' } as any);
    const idA = useCtc.getState().contacts[0].id;

    s.update(idA, { name: 'A-edit' });
    const c = useCtc.getState().contacts;
    expect(c[0].name).toBe('A-edit');
    expect(c[1].name).toBe('B');
  });

  it('update → updatedAt عوض میشه', async () => {
    const s = useCtc.getState();
    s.add(makeContact() as any);
    const id = useCtc.getState().contacts[0].id;
    const t1 = useCtc.getState().contacts[0].updatedAt;

    // تاخیر کوچیک
    await new Promise(r => setTimeout(r, 10));
    s.update(id, { name: 'X' });
    const t2 = useCtc.getState().contacts[0].updatedAt;
    expect(t2).not.toBe(t1);
  });

  it('update → id نامعتبر هیچ کاری نمیکنه', () => {
    const s = useCtc.getState();
    s.add(makeContact() as any);
    s.update('nonexistent-id', { name: 'X' });
    expect(useCtc.getState().contacts[0].name).toBe('احمد رضایی');
  });

  it('remove → فقط هدف رو حذف میکنه', () => {
    const s = useCtc.getState();
    s.add({ ...makeContact(), name: 'A' } as any);
    s.add({ ...makeContact(), name: 'B' } as any);
    const idA = useCtc.getState().contacts[0].id;

    s.remove(idA);
    const c = useCtc.getState().contacts;
    expect(c).toHaveLength(1);
    expect(c[0].name).toBe('B');
  });

  it('remove → id نامعتبر هیچ کاری نمیکنه', () => {
    const s = useCtc.getState();
    s.add(makeContact() as any);
    s.remove('nonexistent-id');
    expect(useCtc.getState().contacts).toHaveLength(1);
  });

  it('remove همه → خالی میشه', () => {
    const s = useCtc.getState();
    s.add(makeContact() as any);
    s.add(makeContact() as any);
    const ids = useCtc.getState().contacts.map(c => c.id);
    ids.forEach(id => s.remove(id));
    expect(useCtc.getState().contacts).toEqual([]);
  });
});

describe('ROLE_LABEL و ROLE_COLOR', () => {
  it('برچسب‌های فارسی درست', () => {
    expect(ROLE_LABEL.customer).toBe('مشتری');
    expect(ROLE_LABEL.supplier).toBe('فروشنده');
    expect(ROLE_LABEL.worker).toBe('کارگر');
  });

  it('رنگ‌های role تعریف شدن', () => {
    expect(ROLE_COLOR.customer).toBeTruthy();
    expect(ROLE_COLOR.supplier).toBeTruthy();
    expect(ROLE_COLOR.worker).toBeTruthy();
  });
});
