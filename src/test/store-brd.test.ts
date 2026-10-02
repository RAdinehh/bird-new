import { describe, it, expect, beforeEach } from 'vitest';
import { useBrd } from '../mod/brd/store';

const makeBird = (o: any = {}) => ({
  name: 'مرغ',
  nameEn: 'Chicken',
  cycleDays: 21,
  fcrStandard: 1.6,
  ...o,
});

const makeBreed = (o: any = {}) => ({
  birdId: 'bird-1',
  name: 'لگهورن',
  fcr: 1.5,
  ...o,
});

beforeEach(() => {
  useBrd.setState({ birds: [], breeds: [] });
});

describe('useBrd — birds', () => {
  it('addBird → id + timestamps', () => {
    useBrd.getState().addBird(makeBird() as any);
    const b = useBrd.getState().birds[0];
    expect(b.id).toBeTruthy();
    expect(b.createdAt).toBeTruthy();
    expect(b.name).toBe('مرغ');
  });

  it('updateBird → فقط هدف', () => {
    const s = useBrd.getState();
    s.addBird(makeBird({ name: 'A' }) as any);
    s.addBird(makeBird({ name: 'B' }) as any);
    const id = useBrd.getState().birds[0].id;
    s.updateBird(id, { name: 'A-edit', cycleDays: 25 });
    expect(useBrd.getState().birds[0].name).toBe('A-edit');
    expect(useBrd.getState().birds[0].cycleDays).toBe(25);
    expect(useBrd.getState().birds[1].name).toBe('B');
  });

  it('deleteBird → پرنده + نژادهای مربوطه پاک میشن', () => {
    const s = useBrd.getState();
    s.addBird(makeBird() as any);
    const birdId = useBrd.getState().birds[0].id;
    s.addBreed(makeBreed({ birdId }) as any);
    s.addBreed(makeBreed({ birdId, name: 'Breed-2' }) as any);
    s.addBreed(makeBreed({ birdId: 'other', name: 'Other' }) as any);

    s.deleteBird(birdId);
    expect(useBrd.getState().birds).toHaveLength(0);
    expect(useBrd.getState().breeds).toHaveLength(1); // فقط other
    expect(useBrd.getState().breeds[0].name).toBe('Other');
  });
});

describe('useBrd — breeds', () => {
  it('addBreed', () => {
    useBrd.getState().addBreed(makeBreed() as any);
    expect(useBrd.getState().breeds).toHaveLength(1);
  });

  it('updateBreed', () => {
    const s = useBrd.getState();
    s.addBreed(makeBreed() as any);
    const id = useBrd.getState().breeds[0].id;
    s.updateBreed(id, { name: 'Edit', fcr: 1.8 });
    expect(useBrd.getState().breeds[0].name).toBe('Edit');
    expect(useBrd.getState().breeds[0].fcr).toBe(1.8);
  });

  it('deleteBreed → فقط هدف', () => {
    const s = useBrd.getState();
    s.addBreed(makeBreed({ name: 'A' }) as any);
    s.addBreed(makeBreed({ name: 'B' }) as any);
    const id = useBrd.getState().breeds[0].id;
    s.deleteBreed(id);
    expect(useBrd.getState().breeds).toHaveLength(1);
    expect(useBrd.getState().breeds[0].name).toBe('B');
  });
});

describe('useBrd — dedupe', () => {
  it('dedupeBirds → حذف تکرار بر اساس name (case-insensitive)', () => {
    const s = useBrd.getState();
    s.addBird(makeBird({ name: 'مرغ' }) as any);
    s.addBird(makeBird({ name: 'مرغ' }) as any);
    s.addBird(makeBird({ name: '  مرغ  ' }) as any);  // با فاصله
    s.addBird(makeBird({ name: 'بوقلمون' }) as any);

    s.dedupeBirds();
    const names = useBrd.getState().birds.map(b => b.name);
    expect(useBrd.getState().birds).toHaveLength(2);
    expect(names).toContain('مرغ');
    expect(names).toContain('بوقلمون');
  });

  it('dedupeBreeds → حذف تکرار بر اساس birdId+name', () => {
    const s = useBrd.getState();
    s.addBreed(makeBreed({ birdId: 'b1', name: 'لگهورن' }) as any);
    s.addBreed(makeBreed({ birdId: 'b1', name: 'لگهورن' }) as any);
    s.addBreed(makeBreed({ birdId: 'b2', name: 'لگهورن' }) as any);  // birdId متفاوت
    s.dedupeBreeds();
    expect(useBrd.getState().breeds).toHaveLength(2);
  });
});
