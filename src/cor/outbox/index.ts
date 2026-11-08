/**
 * index.ts — نقطه ورود Outbox
 *
 * استفاده:
 *   import { outbox } from '@/cor/outbox';
 *   await outbox.publish('dlg:log:saved', { logId });
 */
import { Outbox } from './outbox';
import { registerDefaultProcessors } from './processors';

/** Singleton */
export const outbox = new Outbox();

// ثبت processorهای پیش‌فرض
registerDefaultProcessors(outbox);

// در boot بعد از reload: process pending events
if (typeof window !== 'undefined') {
  setTimeout(() => {
    void outbox.processPending();
  }, 2000);
}

export type {
  OutboxEvent,
  OutboxStatus,
  OutboxProcessor,
  PublishOptions,
} from './types';
export { Outbox } from './outbox';
