/**
 * index.ts — نقطه ورود StorageAdapter
 *
 * استفاده:
 *   import { storage } from '@/cor/storage';
 *   const logs = await storage.getAll<DailyLog>('dlg.logs');
 *
 * در آینده (server):
 *   export const storage = USE_SERVER ? new ServerStorageAdapter() : new LocalStorageAdapter();
 */
import { LocalStorageAdapter } from './local';

/**
 * Singleton — تنها نمونه در کل برنامه
 * در آینده: سوییچ Local/Server بر اساس config
 */
export const storage = new LocalStorageAdapter();

export type { StorageAdapter, EntityKey } from './types';
export { LocalStorageAdapter } from './local';
