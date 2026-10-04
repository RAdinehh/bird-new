/**
 * types.ts — تایپ‌های Event Bus
 */

export interface EventMeta {
  event: string;
  timestamp: number;
  traceId: string;
  source: string;
  handlerCount: number;
  duration?: number;
}

export interface BusHistoryEntry {
  event: string;
  data: any;
  meta: EventMeta;
  listenerIds: string[];
  errors?: any[];
}

export interface EmitOptions {
  traceId?: string;
  source?: string;
}
