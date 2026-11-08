/**
 * local.ts — LocalStorageAdapter
 *
 * CRUD روی Zustand stores موجود.
 * همه متدها async — interface با ServerStorage هم‌شکل است.
 */
import { useDlg } from '../../mod/dlg/store';
import { useWhs } from '../../mod/whs/store';
import { useEgg } from '../../mod/egg/store';
import { useFlk } from '../../mod/flk/store';
import { useTra } from '../../mod/tra/store';
import type { StorageAdapter, EntityKey } from './types';

/**
 * نقشه entity → (store, field)
 * تنها نقطه‌ای که ماژول‌ها به storage متصل می‌شوند.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ENTITY_MAP: Record<EntityKey, { store: any; field: string }> = {
  'dlg.logs': { store: useDlg, field: 'logs' },

  'whs.items': { store: useWhs, field: 'items' },
  'whs.movements': { store: useWhs, field: 'movements' },

  'egg.productions': { store: useEgg, field: 'productions' },
  'egg.sales': { store: useEgg, field: 'sales' },
  'egg.discards': { store: useEgg, field: 'discards' },

  'flk.flocks': { store: useFlk, field: 'flocks' },
  'flk.groups': { store: useFlk, field: 'groups' },
  'flk.groupMembers': { store: useFlk, field: 'groupMembers' },
  'flk.consumptionEvents': { store: useFlk, field: 'consumptionEvents' },

  'tra.invoices': { store: useTra, field: 'invoices' },
  'tra.settlements': { store: useTra, field: 'settlements' },
  'tra.deals': { store: useTra, field: 'deals' },
};

export class LocalStorageAdapter implements StorageAdapter {
  async getAll<T = unknown>(entity: EntityKey): Promise<T[]> {
    const { store, field } = ENTITY_MAP[entity];
    const items = store.getState()[field] as T[] | undefined;
    return items || [];
  }

  async getById<T = unknown>(entity: EntityKey, id: string): Promise<T | null> {
    const items = await this.getAll<{ id: string }>(entity);
    const found = items.find((x) => x.id === id);
    return (found as T | undefined) || null;
  }

  async insert<T extends { id: string }>(entity: EntityKey, item: T): Promise<T> {
    const { store, field } = ENTITY_MAP[entity];
    const current = (store.getState()[field] || []) as T[];
    store.setState({ [field]: [...current, item] });
    return item;
  }

  async update<T extends { id: string }>(
    entity: EntityKey,
    id: string,
    patch: Partial<T>,
  ): Promise<T | null> {
    const { store, field } = ENTITY_MAP[entity];
    const current = (store.getState()[field] || []) as T[];
    let updated: T | null = null;
    const newArr = current.map((x) => {
      if (x.id === id) {
        updated = { ...x, ...patch };
        return updated;
      }
      return x;
    });
    store.setState({ [field]: newArr });
    return updated;
  }

  async delete(entity: EntityKey, id: string): Promise<boolean> {
    const { store, field } = ENTITY_MAP[entity];
    const current = (store.getState()[field] || []) as { id: string }[];
    const filtered = current.filter((x) => x.id !== id);
    if (filtered.length === current.length) return false;
    store.setState({ [field]: filtered });
    return true;
  }
}
