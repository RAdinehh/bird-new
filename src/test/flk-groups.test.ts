import { describe, it, expect, beforeEach } from 'vitest';
import { useFlk } from '../mod/flk/store';

const makeFlock = (o: any = {}) => ({
  id: 'f-' + Math.random().toString(36).slice(2, 9),
  name: 'گله', type: 'layer', status: 'active',
  birdId: 'b1', breedId: 'br1', hallId: '', zoneId: '',
  initialCount: 1000, currentCount: 1000,
  maleCount: null, femaleCount: null,
  layingStartDay: 140, vaccineScheduleId: '',
  hatchDate: '', purchaseDate: '', startDate: '1405/01/01', endDate: '',
  source: '', purchasePrice: 0, deliveryCost: 0, otherCosts: 0,
  notes: '',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  ...o,
});

beforeEach(() => {
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
});

describe('flk — گروه‌های دستی (custom)', () => {
  it('addToGroup → عضو اضافه می‌شود', () => {
    const s = useFlk.getState();
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    // ساخت گروه
    (s as any).addGroup({ name: 'گروه ۱', type: 'custom' });
    const group = useFlk.getState().groups[0];
    expect(group).toBeTruthy();
    (s as any).addToGroup(group.id, f.id);
    const members = useFlk.getState().groupMembers;
    expect(members).toHaveLength(1);
    expect(members[0].flockId).toBe(f.id);
  });

  it('removeFromGroup → leftAt ست می‌شود', () => {
    const s = useFlk.getState();
    const f = makeFlock();
    useFlk.setState({ flocks: [f] } as any);
    (s as any).addGroup({ name: 'گروه ۱', type: 'custom' });
    const group = useFlk.getState().groups[0];
    (s as any).addToGroup(group.id, f.id);
    (s as any).removeFromGroup(group.id, f.id);
    const m = useFlk.getState().groupMembers[0];
    expect(m.leftAt).toBeTruthy();
  });

  it('getFlocksInGroup → فقط عضوهای active', () => {
    const s = useFlk.getState();
    const f1 = makeFlock({ name: 'گله A' });
    const f2 = makeFlock({ name: 'گله B' });
    useFlk.setState({ flocks: [f1, f2] } as any);
    (s as any).addGroup({ name: 'گروه ۱', type: 'custom' });
    const group = useFlk.getState().groups[0];
    (s as any).addToGroup(group.id, f1.id);
    const inGroup = (s as any).getFlocksInGroup(group.id);
    expect(inGroup).toHaveLength(1);
    expect(inGroup[0].id).toBe(f1.id);
  });
});

describe('flk — گروه هوشمند (smart)', () => {
  it('getFlocksInGroup روی smart → بر اساس rule محاسبه می‌شود', () => {
    const s = useFlk.getState();
    const f1 = makeFlock({ name: 'گله A', type: 'layer', status: 'active' });
    const f2 = makeFlock({ name: 'گله B', type: 'broiler', status: 'active' });
    useFlk.setState({ flocks: [f1, f2] } as any);
    (s as any).addGroup({
      name: 'همه لایه‌ها',
      type: 'smart',
      rule: { type: 'layer' },
    });
    const group = useFlk.getState().groups[0];
    const matched = (s as any).getFlocksInGroup(group.id);
    expect(matched).toHaveLength(1);
    expect(matched[0].id).toBe(f1.id);
  });

  it('getGroupsForFlock → smart group عضو خودکار', () => {
    const s = useFlk.getState();
    const f = makeFlock({ type: 'layer', status: 'active' });
    useFlk.setState({ flocks: [f] } as any);
    (s as any).addGroup({
      name: 'همه لایه‌ها',
      type: 'smart',
      rule: { type: 'layer' },
    });
    const groups = (s as any).getGroupsForFlock(f.id);
    expect(groups).toHaveLength(1);
    expect(groups[0].type).toBe('smart');
  });

  it('حذف گله از شرط smart → عضو نمی‌شود', () => {
    const s = useFlk.getState();
    const f = makeFlock({ type: 'broiler', status: 'active' });
    useFlk.setState({ flocks: [f] } as any);
    (s as any).addGroup({
      name: 'همه لایه‌ها',
      type: 'smart',
      rule: { type: 'layer' },
    });
    const group = useFlk.getState().groups[0];
    const matched = (s as any).getFlocksInGroup(group.id);
    expect(matched).toHaveLength(0);
  });
});

describe('flk — گروه تودرتو (parentGroupId)', () => {
  it('includeDescendants → زیرگروه هم شامل می‌شود', () => {
    const s = useFlk.getState();
    const f = makeFlock({ name: 'گله A' });
    useFlk.setState({ flocks: [f] } as any);
    (s as any).addGroup({ name: 'مادر', type: 'custom' });
    const parent = useFlk.getState().groups[0];
    (s as any).addGroup({ name: 'فرزند', type: 'custom', parentGroupId: parent.id });
    const child = useFlk.getState().groups[1];
    (s as any).addToGroup(child.id, f.id);

    const inParent = (s as any).getFlocksInGroup(parent.id, true);
    expect(inParent).toHaveLength(1);
    expect(inParent[0].id).toBe(f.id);
  });
});
