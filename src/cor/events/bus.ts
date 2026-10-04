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

type Handler<T> = (data: T, meta: EventMeta) => void | Promise<void>;

interface ListenerEntry<T> {
  handler: Handler<T>;
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

  on<T>(event: string, handler: Handler<T>, options?: { once?: boolean; id?: string }): () => void {
    const entries = this.listeners.get(event) || [];
    const id = options?.id || `h_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    entries.push({ handler, once: options?.once || false, id });
    this.listeners.set(event, entries);
    return () => this.off(event, handler);
  }

  off<T>(event: string, handler: Handler<T>): void {
    const entries = this.listeners.get(event) || [];
    this.listeners.set(event, entries.filter(e => e.handler !== handler));
  }

  once<T>(event: string, handler: Handler<T>): () => void {
    return this.on(event, handler, { once: true });
  }

  async emit<T>(event: string, data: T, meta?: Partial<EventMeta>): Promise<{
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
