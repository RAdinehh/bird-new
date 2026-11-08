/**
 * stores.ts — ثبت ۵ store برای atomicTransaction
 *
 * هر store فقط داده‌های «snapshotable» را نگه می‌دارد (نه actionها).
 * Zustand setState merge می‌کند، پس بقیه فیلدها دست‌نخورده می‌مانند.
 */
import { useDlg } from '../../mod/dlg/store';
import { useWhs } from '../../mod/whs/store';
import { useEgg } from '../../mod/egg/store';
import { useFlk } from '../../mod/flk/store';
import { useTra } from '../../mod/tra/store';
import type { AtomicStore } from './types';

/** dlg — فقط logs */
export const dlgStore: AtomicStore = {
  name: 'dlg',
  getSnapshot: () => useDlg.getState().logs,
  restore: (snap) => useDlg.setState({ logs: snap }),
};

/** whs — items + movements (addMovement هر دو را می‌زند) */
export const whsStore: AtomicStore = {
  name: 'whs',
  getSnapshot: () => {
    const s = useWhs.getState();
    return { items: s.items, movements: s.movements };
  },
  restore: (snap) => useWhs.setState({
    items: snap.items,
    movements: snap.movements,
  }),
};

/** egg — productions + sales + discards */
export const eggStore: AtomicStore = {
  name: 'egg',
  getSnapshot: () => {
    const s = useEgg.getState();
    return {
      productions: s.productions,
      sales: s.sales,
      discards: s.discards,
    };
  },
  restore: (snap) => useEgg.setState({
    productions: snap.productions,
    sales: snap.sales,
    discards: snap.discards,
  }),
};

/** flk — flocks + groups + groupMembers + consumptionEvents */
export const flkStore: AtomicStore = {
  name: 'flk',
  getSnapshot: () => {
    const s = useFlk.getState();
    return {
      flocks: s.flocks,
      groups: s.groups,
      groupMembers: s.groupMembers,
      consumptionEvents: s.consumptionEvents,
    };
  },
  restore: (snap) => useFlk.setState({
    flocks: snap.flocks,
    groups: snap.groups,
    groupMembers: snap.groupMembers,
    consumptionEvents: snap.consumptionEvents,
  }),
};

/** tra — invoices + settlements + deals (نیاز به D6) */
export const traStore: AtomicStore = {
  name: 'tra',
  getSnapshot: () => {
    const s = useTra.getState();
    return {
      invoices: s.invoices,
      settlements: s.settlements,
      deals: s.deals,
    };
  },
  restore: (snap) => useTra.setState({
    invoices: snap.invoices,
    settlements: snap.settlements,
    deals: snap.deals,
  }),
};

/** همه storeها (برای استفاده در ماژول‌ها) */
export const ALL_STORES: AtomicStore[] = [
  dlgStore,
  whsStore,
  eggStore,
  flkStore,
  traStore,
];
