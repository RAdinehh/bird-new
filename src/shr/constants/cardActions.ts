/**
 * cardActions.ts — دیکشنری مرکزی و استاندارد برای دکمه‌های کارت‌ها (CardActions)
 * هدف: هماهنگی ۱۰۰٪ متن، رنگ و منطق دکمه‌ها در تمام ماژول‌های نرم‌افزار
 * 
 * نحوه استفاده در ماژول‌ها:
 * <CardActions actions={[
 *   { ...ACTION_PRESETS.EDIT, onClick: onEdit, hidden: isArchived },
 *   { ...ACTION_PRESETS.DELETE, onClick: onDelete, hidden: !isArchived }
 * ]} />
 */
import type { CardAction } from '../components/ui/CardActions';

// priority (وزن): عدد کوچکتر = قرارگیری در جایگاه جلوتر (راست‌تر)
export const ACTION_PRESETS: Record<string, Omit<CardAction, 'onClick' | 'hidden' | 'disabled'>> = {
  RESTORE:        { label: 'بازگردانی', variant: 'primary', priority: 10 },
  RECORD_INVOICE: { label: '💰 ثبت فاکتور', variant: 'primary', priority: 15 },
  EDIT:    { label: 'ویرایش', variant: 'outline', priority: 20 },
  CORRECT: { label: 'اصلاح', variant: 'outline', priority: 25 },
  TRANSFER:       { label: '🔀 جابجایی', variant: 'outline', priority: 28 },
  HISTORY:        { label: 'همه رویدادها', variant: 'outline', priority: 30 },
  ARCHIVE: { label: 'آرشیو', variant: 'danger-outline', priority: 90 },
  RETIRE:         { label: '🔚 اسقاط / فروش', variant: 'danger', priority: 95 },
  DELETE:         { label: 'حذف', variant: 'danger-outline', priority: 100 },
};
