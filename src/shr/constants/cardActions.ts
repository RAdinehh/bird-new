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

export const ACTION_PRESETS: Record<string, Omit<CardAction, 'onClick' | 'hidden' | 'disabled'>> = {
  EDIT:    { label: 'ویرایش', variant: 'outline' },
  CORRECT: { label: 'اصلاح', variant: 'outline' },
  HISTORY: { label: 'همه رویدادها', variant: 'outline' },
  ARCHIVE: { label: 'آرشیو', variant: 'outline' },
  RESTORE: { label: 'بازگردانی', variant: 'primary' },
  DELETE:  { label: 'حذف', variant: 'danger-outline' },
};
