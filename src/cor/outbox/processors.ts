/**
 * processors.ts — ثبت processorهای پیش‌فرض Outbox
 *
 * هر processor یک Outbox event را به bus.emit موجود forward می‌کند
 * (سازگاری با subscribers فعلی — که از bus استفاده می‌کنند).
 *
 * در آینده: processor می‌تواند به server POST کند (بدون تغییر subscribers).
 *
 * ⚠️ فقط رویدادهایی که در src/cor/events/events.ts (AppEvents) تعریف شده‌اند
 * در اینجا ثبت می‌شوند. اضافه کردن رویداد جدید = اضافه کردن به AppEvents اول.
 */
import { bus } from '../events';
import type { AppEvents, AppEventName } from '../events/events';
import type { Outbox } from './outbox';

/**
 * forward یک Outbox event به bus.emit موجود
 *
 * Payload از type `Record<string, unknown>` (عمومی Outbox) به type دقیق
 * `AppEvents[K]` cast می‌شود. مسئولیت درست بودن shape با publisher است
 * (که در `useDlgSave` و سایر ماژول‌ها با type دقیق publish می‌کنند).
 *
 * این تنها cast در کل Outbox infrastructure است — boundary بین
 * generic Outbox و typed Bus.
 */
async function forwardToBus<K extends AppEventName>(
  type: K,
  payload: Record<string, unknown>,
): Promise<void> {
  await bus.emit(type, payload as unknown as AppEvents[K], {
    source: 'outbox',
  });
}

/**
 * ثبت processorهای پیش‌فرض
 */
export function registerDefaultProcessors(outbox: Outbox): void {
  // ─── dlg (ثبت روزانه) — ۶ رویداد ───
  outbox.subscribe('dlg:deaths:recorded', async (e) => {
    await forwardToBus('dlg:deaths:recorded', e.payload);
  });
  outbox.subscribe('dlg:feed:consumed', async (e) => {
    await forwardToBus('dlg:feed:consumed', e.payload);
  });
  outbox.subscribe('dlg:vaccine:given', async (e) => {
    await forwardToBus('dlg:vaccine:given', e.payload);
  });
  outbox.subscribe('dlg:medication:given', async (e) => {
    await forwardToBus('dlg:medication:given', e.payload);
  });
  outbox.subscribe('dlg:egg:recorded', async (e) => {
    await forwardToBus('dlg:egg:recorded', e.payload);
  });
  outbox.subscribe('dlg:log:deleted', async (e) => {
    await forwardToBus('dlg:log:deleted', e.payload);
  });

  // ─── tra (معاملات) — ۳ رویداد ───
  outbox.subscribe('tra:invoice:created', async (e) => {
    await forwardToBus('tra:invoice:created', e.payload);
  });
  outbox.subscribe('tra:invoice:updated', async (e) => {
    await forwardToBus('tra:invoice:updated', e.payload);
  });
  outbox.subscribe('tra:invoice:deleted', async (e) => {
    await forwardToBus('tra:invoice:deleted', e.payload);
  });

  // ─── egg (تخم) — ۳ رویداد ───
  outbox.subscribe('egg:production:created', async (e) => {
    await forwardToBus('egg:production:created', e.payload);
  });
  outbox.subscribe('egg:production:updated', async (e) => {
    await forwardToBus('egg:production:updated', e.payload);
  });
  outbox.subscribe('egg:production:deleted', async (e) => {
    await forwardToBus('egg:production:deleted', e.payload);
  });

  // ─── flk (گله) — ۳ رویداد ───
  outbox.subscribe('flk:flock:created', async (e) => {
    await forwardToBus('flk:flock:created', e.payload);
  });
  outbox.subscribe('flk:flock:updated', async (e) => {
    await forwardToBus('flk:flock:updated', e.payload);
  });
  outbox.subscribe('flk:flock:archived', async (e) => {
    await forwardToBus('flk:flock:archived', e.payload);
  });

  // ─── inc (جوجه‌کشی) — ۲ رویداد ───
  outbox.subscribe('inc:hatch:created', async (e) => {
    await forwardToBus('inc:hatch:created', e.payload);
  });
  outbox.subscribe('inc:hatch:deleted', async (e) => {
    await forwardToBus('inc:hatch:deleted', e.payload);
  });

  // ─── whs (انبار) — ۱ رویداد ───
  outbox.subscribe('whs:movement:created', async (e) => {
    await forwardToBus('whs:movement:created', e.payload);
  });
}
