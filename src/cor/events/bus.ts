/**
 * bus.ts — Event Bus با Trace + Logger
 *
 * مزایا:
 * - حذف circular dependency
 * - trace ID برای زنجیره علیت
 * - source attribution
 * - history + timing
 * - dev mode با logger
 */
import type { EventMeta, BusHistoryEntry } from './types';
import type { AppEventName, AppEventData } from './events';

interface ListenerEntry<T> {
  handler: (data: T, meta: EventMeta) => void | Promise<void>;
  once: boolean;
  id: string;
}

export class EventBus {
  private listeners = new Map<string, ListenerEntry<any>[]>();
  private history: BusHistoryEntry[] = [];
  private maxHistory = 200;
  private devMode = false;

  setDevMode(on: boolean) { this.devMode = on; }
  isDevMode() { return this.devMode; }

  on<K extends AppEventName>(
    event: K,
    handler: (data: AppEventData<K>, meta: EventMeta) => void | Promise<void>,
    options?: { once?: boolean; id?: string },
  ): () => void {
    const entries = this.listeners.get(event) || [];
    const id = options?.id || `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    entries.push({ handler: handler as any, once: options?.once || false, id });
    this.listeners.set(event, entries);
    return () => this.off(event, handler as any);
  }

  off<K extends AppEventName>(
    event: K,
    handler: (data: AppEventData<K>, meta: EventMeta) => void | Promise<void>,
  ): void {
    const entries = this.listeners.get(event) || [];
    this.listeners.set(event, entries.filter(e => e.handler !== handler));
  }

  once<K extends AppEventName>(
    event: K,
    handler: (data: AppEventData<K>, meta: EventMeta) => void | Promise<void>,
  ): () => void {
    return this.on(event, handler, { once: true });
  }

  async emit<K extends AppEventName>(
    event: K,
    data: AppEventData<K>,
    meta?: Partial<EventMeta> & { source?: string },
  ): Promise<{
    traceId: string;
    duration: number;
    handlerCount: number;
    errors: any[];
  }> {
    const start = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const traceId = meta?.traceId || `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const source = meta?.source || 'unknown';
    const entries = (this.listeners.get(event) || []).slice();

    const errors: any[] = [];

    for (const entry of entries) {
      try {
        await entry.handler(data, {
          event,
          timestamp: Date.now(),
          traceId,
          source,
          handlerCount: entries.length,
        });
      } catch (e) {
        errors.push({ id: entry.id, error: e });
        if (this.devMode) {
          console.error(`[bus] handler ${entry.id} for "${event}" failed:`, e);
        }
      }
      if (entry.once) this.off(event, entry.handler);
    }

    const duration = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start;

    // ثبت در history (فقط اگه dev mode یا handler داشت)
    if (this.devMode || entries.length > 0) {
      this.history.unshift({
        event,
        data,
        meta: { event, timestamp: Date.now(), traceId, source, handlerCount: entries.length, duration },
        listenerIds: entries.map(e => e.id),
        errors: errors.length > 0 ? errors : undefined,
      });
      if (this.history.length > this.maxHistory) this.history.pop();
    }

    return { traceId, duration, handlerCount: entries.length, errors };
  }

  getHistory(): BusHistoryEntry[] { return this.history; }
  clearHistory(): void { this.history = []; }

  getListeners(event?: string): any[] {
    if (event) return this.listeners.get(event) || [];
    const all: any[] = [];
    for (const [e, arr] of this.listeners.entries()) {
      arr.forEach(a => all.push({ ...a, event: e }));
    }
    return all;
  }

  /** برای تست: پاک کردن همه listenerها */
  reset(): void {
    this.listeners.clear();
    this.history = [];
  }
}

// singleton
export const bus = new EventBus();
