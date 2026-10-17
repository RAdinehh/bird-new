import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

beforeEach(() => {
  useFlk.setState({ flocks: [] } as any);
});

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: '', hallId: '', zoneId: '',
  initialCount: 1000, currentCount: 1000,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

describe('FlockBreed — استاندارد و مختلط', () => {
  it('گله استاندارد با breedId', () => {
    useFlk.getState().add(makeFlock({ breedId: 'br-1', breedKind: 'standard' }) as any);
    const saved = useFlk.getState().flocks[0];
    expect(saved.breedId).toBe('br-1');
    expect(saved.breedKind).toBe('standard');
    expect(saved.breedLabel).toBeFalsy();
  });

  it('گله مختلط با breedLabel', () => {
    useFlk.getState().add(makeFlock({ breedId: '', breedKind: 'mixed', breedLabel: 'مرندی محلی' }) as any);
    const saved = useFlk.getState().flocks[0];
    expect(saved.breedId).toBe('');
    expect(saved.breedKind).toBe('mixed');
    expect(saved.breedLabel).toBe('مرندی محلی');
  });

  it('گله بدون breedKind (سازگاری قدیمی)', () => {
    useFlk.getState().add(makeFlock({ breedId: 'br-1' }) as any);
    const saved = useFlk.getState().flocks[0];
    expect(saved.breedId).toBe('br-1');
  });
});
