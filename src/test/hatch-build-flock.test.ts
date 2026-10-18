import { describe, it, expect } from 'vitest';
import { buildFlockFromHatch } from '../mod/inc/api/hatchActions';

const mockBird = { id: 'b1', name: 'مرغ' } as any;
const mockHatch = { date: '1405/07/01', hatched: 50, maleCount: 20, femaleCount: 25, unknownCount: 5 } as any;

describe('buildFlockFromHatch — فیلدهای جدید', () => {
  it('unknownCount منتقل می‌شود', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: mockHatch, bird: mockBird, breedId: 'br1',
    });
    expect(r.unknownCount).toBe(5);
  });

  it('purchasePrice از entryUnitPrice', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: mockHatch, bird: mockBird, breedId: 'br1',
      entryUnitPrice: 15000,
    });
    expect(r.purchasePrice).toBe(15000);
  });

  it('deliveryCost از entryShippingCost', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: mockHatch, bird: mockBird, breedId: 'br1',
      entryShippingCost: 5000,
    });
    expect(r.deliveryCost).toBe(5000);
  });

  it('layingStartDay از layingStartDayFromStd', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: mockHatch, bird: mockBird, breedId: 'br1',
      layingStartDayFromStd: 140,
    });
    expect(r.layingStartDay).toBe(140);
  });

  it('بدون مقدار → default (0/null)', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: { ...mockHatch, unknownCount: null }, bird: mockBird, breedId: 'br1',
    });
    expect(r.unknownCount).toBeNull();
    expect(r.purchasePrice).toBeNull();
    expect(r.deliveryCost).toBeNull();
    expect(r.layingStartDay).toBe(0);
  });

  it('initialCount/currentCount از hatched', () => {
    const r = buildFlockFromHatch({
      formName: 'گله A', formType: 'layer', formHallId: '', formZoneId: '',
      hatch: mockHatch, bird: mockBird, breedId: 'br1',
    });
    expect(r.initialCount).toBe(50);
    expect(r.currentCount).toBe(50);
  });
});
