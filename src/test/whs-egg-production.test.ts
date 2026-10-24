import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs } from '../mod/whs/store';
import { useEgg } from '../mod/egg/store';
import { bus } from '../cor/events';
import { registerEggWhsHandlers } from '../mod/whs/handlers';

describe('whs egg production cascade (live)', () => {
  beforeEach(() => {
    bus.reset();
    useWhs.setState({ items: [], movements: [] });
    useEgg.setState({ productions: [], sales: [] });
    registerEggWhsHandlers();
  });

  it('تولید تخم‌مرغ → موجودی انبار (خوراکی/نطفه‌دار/شکسته) اضافه می‌شود', async () => {
    const productionId = 'prod-1';
    const production = {
      id: productionId,
      date: '1405/07/20',
      flockId: 'flock-1',
      eatingCount: 300,
      fertileCount: 100,
      brokenCount: 20,
      softCount: 5,
      dirtyCount: 5,
    };

    await bus.emit('egg:production:created', {
      prodId: productionId,
      production,
    }, { source: 'test' });

    const items = useWhs.getState().items;

    const eatingItem = items.find(i => i.category === 'egg' && i.name === 'تخم مرغ');
    expect(eatingItem).toBeDefined();
    expect(eatingItem!.currentStock).toBe(300);

    const fertileItem = items.find(i => i.category === 'egg' && i.name === 'تخم نطفه‌دار');
    expect(fertileItem).toBeDefined();
    expect(fertileItem!.currentStock).toBe(100);

    const brokenItem = items.find(i => i.category === 'broken' && i.name === 'تخم شکسته');
    expect(brokenItem).toBeDefined();
    expect(brokenItem!.currentStock).toBe(30); // 20 + 5 + 5
  });
});
