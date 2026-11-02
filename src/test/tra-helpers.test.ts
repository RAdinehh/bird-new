import { describe, it, expect } from 'vitest';
import { format as formatJ, addDays as addDaysJ } from 'date-fns-jalali';
import { daysUntilJalali, daysUntilDue, computeUpcoming } from '../mod/tra/helpers';
import type { Invoice } from '../mod/tra/types';

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 'inv-' + Math.random(), type: 'sale', date: '1405/01/01',
    partyId: 'p1', category: 'chick', items: [], total: 100000,
    payments: [], dueDate: '1405/01/01', relatedFlockId: '',
    relatedEntryId: '', notes: '', createdAt: '', updatedAt: '', ...overrides,
  };
}

const today = formatJ(new Date(), 'yyyy/MM/dd');
const plus5 = formatJ(addDaysJ(new Date(), 5), 'yyyy/MM/dd');
const minus5 = formatJ(addDaysJ(new Date(), -5), 'yyyy/MM/dd');
const plus30 = formatJ(addDaysJ(new Date(), 30), 'yyyy/MM/dd');

describe('daysUntilJalali', () => {
  it('null/undefined/empty → null', () => {
    expect(daysUntilJalali(null)).toBeNull();
    expect(daysUntilJalali(undefined)).toBeNull();
    expect(daysUntilJalali('')).toBeNull();
  });
  it('invalid → null', () => { expect(daysUntilJalali('not-a-date')).toBeNull(); });
  it('today → 0', () => { expect(daysUntilJalali(today)).toBe(0); });
  it('Persian digits', () => {
    const persian = today.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
    expect(daysUntilJalali(persian)).toBe(0);
  });
  it('future → positive', () => { expect(daysUntilJalali(plus5)).toBe(5); });
  it('past → negative', () => { expect(daysUntilJalali(minus5)).toBe(-5); });
});

describe('daysUntilDue', () => {
  it('delegates', () => {
    expect(daysUntilDue(makeInvoice({ dueDate: plus5 }))).toBe(5);
    expect(daysUntilDue(makeInvoice({ dueDate: '' }))).toBeNull();
  });
});

describe('computeUpcoming (Dunning C4)', () => {
  it('no dueDate → excluded', () => {
    expect(computeUpcoming([makeInvoice({ dueDate: '' })])).toEqual([]);
  });
  it('remindersMuted → excluded', () => {
    expect(computeUpcoming([makeInvoice({ dueDate: plus5, remindersMuted: true })])).toEqual([]);
  });
  it('snoozed (nextReminderAt > today) → excluded', () => {
    expect(computeUpcoming([makeInvoice({ dueDate: plus5, nextReminderAt: plus30 })])).toEqual([]);
  });
  it('nextReminderAt past/today → included', () => {
    const a = makeInvoice({ id: 'a', dueDate: plus5, nextReminderAt: minus5 });
    const b = makeInvoice({ id: 'b', dueDate: plus5, nextReminderAt: today });
    expect(computeUpcoming([a, b]).map((r) => r.inv.id)).toEqual(['a', 'b']);
  });
  it('no nextReminderAt → included', () => {
    expect(computeUpcoming([makeInvoice({ dueDate: plus5 })])).toHaveLength(1);
  });
  it('dueDate > 7 days → excluded', () => {
    expect(computeUpcoming([makeInvoice({ dueDate: plus30 })])).toEqual([]);
  });
  it('overdue + future sorted', () => {
    const a = makeInvoice({ id: 'a', dueDate: minus5 });
    const b = makeInvoice({ id: 'b', dueDate: plus5 });
    expect(computeUpcoming([a, b]).map((r) => r.inv.id)).toEqual(['a', 'b']);
  });
});
