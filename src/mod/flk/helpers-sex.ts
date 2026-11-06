/**
 * helpers-sex.ts — helperهای مشترک فاز ۴b
 * استخراج منطق ساخت event فروش با sex صحیح
 */
import type { FlockEvent } from './types-store';
import type { FlockSexBalanceEvent } from './store';

export interface SaleEventInput {
  delta: number;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  flockId: string;
  invoiceId: string;
  invoiceNumber?: string;
  partyId?: string;
  date: string;
  notes?: string;
  unitPrice?: number;
  totalPrice?: number;
}

/**
 * deriveSaleEvents — ساخت ۱ تا ۳ event فروش با sex صحیح
 *
 * منطق (مطابق ROADMAP Invariant #2 + sexBalanceEvents):
 * - اگر maleCount/femaleCount/unknownCount داده شده: تا ۳ event جدا
 * - اگر هیچ‌کدام داده نشده (unsplit): ۱ event با sex='mixed'
 * - sum(events.count) === delta
 * - اولویت fallback: male → female → unknown → mixed (مطابق pre-flight B1)
 */
export function deriveSaleEvents(input: SaleEventInput): FlockEvent[] {
  const { delta } = input;
  if (delta <= 0) return [];

  const mD = Number(input.maleCount || 0);
  const fD = Number(input.femaleCount || 0);
  const uD = Number(input.unknownCount || 0);
  const gSum = mD + fD + uD;

  const common = {
    flockId: input.flockId,
    date: input.date,
    type: 'sell' as const,
    direction: -1 as const,
    buyerId: input.partyId,
    unitPrice: input.unitPrice,
    totalPrice: input.totalPrice,
    invoiceId: input.invoiceId,
    createdAt: new Date().toISOString(),
  };

  // unsplit → ۱ event mixed
  if (gSum === 0) {
    return [{
      id: `sell-${input.invoiceId}-${input.flockId}-mixed-${Date.now()}`,
      ...common,
      count: delta,
      sex: 'mixed',
      notes: input.notes || `فروش از فاکتور ${input.invoiceNumber || ''} (بدون تفکیک)`,
    } as FlockEvent];
  }

  // split → تا ۳ event جدا
  const events: FlockEvent[] = [];
  const safeM = Math.min(mD, delta);
  const safeF = Math.min(fD, delta - safeM);
  const safeU = Math.min(uD, delta - safeM - safeF);
  const rem = delta - safeM - safeF - safeU;

  const push = (sex: 'male' | 'female' | 'mixed', count: number) => {
    if (count <= 0) return;
    events.push({
      id: `sell-${input.invoiceId}-${input.flockId}-${sex}-${Date.now()}-${events.length}`,
      ...common,
      count,
      sex,
      notes: input.notes || `فروش از فاکتور ${input.invoiceNumber || ''} (${sex})`,
    } as FlockEvent);
  };

  push('male', safeM);
  push('female', safeF);
  push('mixed', safeU + rem);

  return events;
}

/**
 * sumSexForFlock — جمع sex از items فاکتور برای یک flock مشخص
 */
export function sumSexForFlock(items: any[], flockId: string) {
  let m = 0, f = 0, u = 0;
  for (const it of items || []) {
    if (it.flockId !== flockId) continue;
    m += Number(it.maleCount || 0);
    f += Number(it.femaleCount || 0);
    u += Number(it.unknownCount || 0);
  }
  return { male: m, female: f, unknown: u };
}


// ═════════════════════════════════════════════════════════════
// B3 — audit helper (sexBalanceEvents)
// ═════════════════════════════════════════════════════════════
export interface SaleAuditInput {
  flockBefore: { male: number; female: number; unknown: number };
  flockAfter: { male: number; female: number; unknown: number };
  date: string;
  note?: string;
}

export function buildSaleAudit(params: SaleAuditInput): FlockSexBalanceEvent {
  return {
    id: `sale-audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: params.date,
    type: 'sale',
    before: params.flockBefore,
    after: params.flockAfter,
    delta: {
      male: params.flockAfter.male - params.flockBefore.male,
      female: params.flockAfter.female - params.flockBefore.female,
      unknown: params.flockAfter.unknown - params.flockBefore.unknown,
    },
    note: params.note,
    createdAt: new Date().toISOString(),
  };
}
