/**
 * types.ts — StorageAdapter interface
 *
 * لایه انتزاعی CRUD که امکان تعویض LocalStorage ↔ ServerStorage
 * را بدون تغییر در ماژول‌ها فراهم می‌کند.
 *
 * الهام از Repository Pattern (Martin Fowler) + Hexagonal Architecture.
 */

/**
 * کلید Entity — منبع داده
 * شکل: 'ماژول.فیلد'
 */
export type EntityKey =
  | 'dlg.logs'
  | 'whs.items' | 'whs.movements'
  | 'egg.productions' | 'egg.sales' | 'egg.discards'
  | 'flk.flocks' | 'flk.groups' | 'flk.groupMembers' | 'flk.consumptionEvents'
  | 'tra.invoices' | 'tra.settlements' | 'tra.deals';

/**
 * StorageAdapter — interface مشترک Local/Server
 *
 * همه متدها async — آماده server (fetch) بدون تغییر در interface.
 */
export interface StorageAdapter {
  /** خواندن همه آیتم‌ها */
  getAll<T = unknown>(entity: EntityKey): Promise<T[]>;

  /** خواندن یک آیتم با id */
  getById<T = unknown>(entity: EntityKey, id: string): Promise<T | null>;

  /** افزودن آیتم (id باید در item باشد) */
  insert<T extends { id: string }>(entity: EntityKey, item: T): Promise<T>;

  /** بروزرسانی جزئی */
  update<T extends { id: string }>(
    entity: EntityKey,
    id: string,
    patch: Partial<T>,
  ): Promise<T | null>;

  /** حذف آیتم — true اگر حذف شد */
  delete(entity: EntityKey, id: string): Promise<boolean>;
}
