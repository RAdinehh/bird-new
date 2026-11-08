/**
 * outbox.ts — Outbox کلاس
 *
 * صف رویدادها با retry خودکار.
 * در حالت فعلی: localStorage persistence (بین sessions).
 * در آینده: صف به سرور می‌رود (multi-user sync).
 */
import { v4 as uuid } from 'uuid';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OutboxEvent,
  OutboxProcessor,
  PublishOptions,
} from './types';

interface OutboxState {
  events: OutboxEvent[];
  add: (event: OutboxEvent) => void;
  update: (id: string, patch: Partial<OutboxEvent>) => void;
  remove: (id: string) => void;
  clearDone: () => void;
}

const useOutboxStore = create<OutboxState>()(
  persist(
    (set) => ({
      events: [],
      add: (event) => set((s) => ({ events: [...s.events, event] })),
      update: (id, patch) => set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),
      remove: (id) => set((s) => ({
        events: s.events.filter((e) => e.id !== id),
      })),
      clearDone: () => set((s) => ({
        events: s.events.filter((e) => e.status !== 'done'),
      })),
    }),
    { name: 'pm-outbox' },
  ),
);

/**
 * Outbox — صف رویدادها
 * Singleton در index.ts
 */
export class Outbox {
  private processors = new Map<string, OutboxProcessor[]>();
  private isProcessing = false;

  /**
   * ثبت processor برای یک نوع رویداد
   * @returns unsubscribe function
   */
  subscribe(type: string, processor: OutboxProcessor): () => void {
    if (!this.processors.has(type)) {
      this.processors.set(type, []);
    }
    this.processors.get(type)!.push(processor);

    return () => {
      const list = this.processors.get(type);
      if (!list) return;
      const idx = list.indexOf(processor);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  /**
   * انتشار رویداد
   * فوراً در صف ذخیره می‌شود، سپس پردازش می‌شود.
   */
  async publish(
    type: string,
    payload: Record<string, unknown>,
    opts: PublishOptions = {},
  ): Promise<string> {
    const event: OutboxEvent = {
      id: uuid(),
      type,
      payload,
      status: 'pending',
      attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      createdAt: new Date().toISOString(),
      txid: opts.txid,
    };

    useOutboxStore.getState().add(event);

    // پردازش async — منتظر نمی‌مانیم (fire and forget)
    void this.processEvent(event.id);

    return event.id;
  }

  /**
   * پردازش یک رویداد (داخلی)
   */
  private async processEvent(eventId: string): Promise<void> {
    if (this.isProcessing) {
      // اگر پردازش جاری است، صف منتظر می‌ماند
      return;
    }

    this.isProcessing = true;
    try {
      const event = useOutboxStore.getState().events.find((e) => e.id === eventId);
      if (!event || event.status === 'done') return;

      const processors = this.processors.get(event.type) || [];
      if (processors.length === 0) {
        // هیچ processor ثبت نشده — رویداد را done می‌کنیم (بدون پردازش)
        useOutboxStore.getState().update(eventId, {
          status: 'done',
          lastAttemptAt: new Date().toISOString(),
        });
        return;
      }

      // تلاش‌های مکرر
      let lastError: Error | null = null;
      for (let attempt = 1; attempt <= event.maxAttempts; attempt++) {
        useOutboxStore.getState().update(eventId, {
          status: 'processing',
          attempts: attempt,
          lastAttemptAt: new Date().toISOString(),
        });

        try {
          for (const processor of processors) {
            await processor({ ...event, attempts: attempt });
          }
          // موفق
          useOutboxStore.getState().update(eventId, {
            status: 'done',
            lastError: undefined,
          });
          return;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.error(
            `[outbox] ${event.type} attempt ${attempt}/${event.maxAttempts} failed:`,
            lastError,
          );
        }
      }

      // همه تلاش‌ها fail شدند
      useOutboxStore.getState().update(eventId, {
        status: 'failed',
        lastError: lastError?.message || 'unknown',
      });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * پردازش همه رویدادهای pending/failed (برای boot بعد از reload)
   */
  async processPending(): Promise<void> {
    const pending = useOutboxStore.getState().events.filter(
      (e) => e.status === 'pending' || e.status === 'failed',
    );
    for (const event of pending) {
      await this.processEvent(event.id);
    }
  }

  /**
   * وضعیت صف (برای UI/debug)
   */
  getState() {
    return useOutboxStore.getState();
  }

  /**
   * پاک کردن رویدادهای done (housekeeping)
   */
  clearDone(): void {
    useOutboxStore.getState().clearDone();
  }
}
