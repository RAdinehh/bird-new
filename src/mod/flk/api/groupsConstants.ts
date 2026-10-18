/**
 * groupsConstants.ts — constants گروه
 * جدا شده از GroupsPage.tsx
 */
import type { FlockGroupType } from '../store';

export const TYPE_LABEL: Record<FlockGroupType, string> = {
  season: '🗓 فصلی',
  breed: '🧬 نژادی',
  cohort: '👥 هم‌دوره',
  farm: '🏭 مزرعه',
  owner: '👤 مالک',
  custom: '📁 سفارشی',
  smart: '🤖 هوشمند',
};

export const TYPE_DESC: Record<FlockGroupType, string> = {
  season: 'گله‌های یه فصل (هر ترکیبی)',
  breed: 'گله‌های هم‌نژاد (سن آزاد)',
  cohort: 'گله‌های هم‌دوره (سن نزدیک)',
  farm: 'گله‌های یه مزرعه',
  owner: 'گله‌های یه مالک/شریک',
  custom: 'دسته‌بندی دلخواه',
  smart: 'قوانین خودکار',
};

export const TYPE_OPTIONS = [
  { value: 'season', label: 'فصلی', icon: '🗓', subtitle: 'گله‌های یه فصل' },
  { value: 'breed', label: 'نژادی', icon: '🧬', subtitle: 'گله‌های هم‌نژاد (سن آزاد)' },
  { value: 'cohort', label: 'هم‌دوره', icon: '👥', subtitle: 'گله‌های هم‌دوره (سن نزدیک)' },
  { value: 'farm', label: 'مزرعه', icon: '🏭', subtitle: 'گله‌های یه مزرعه' },
  { value: 'owner', label: 'مالک', icon: '👤', subtitle: 'گله‌های یه مالک' },
  { value: 'custom', label: 'سفارشی', icon: '📁', subtitle: 'دسته‌بندی دلخواه' },
  { value: 'smart', label: 'هوشمند', icon: '🤖', subtitle: 'قوانین خودکار' },
];

export const TYPE_ICON_MAP: Record<FlockGroupType, string> = TYPE_OPTIONS.reduce((acc, o) => {
  acc[o.value as FlockGroupType] = o.icon;
  return acc;
}, {} as Record<FlockGroupType, string>);

export const NAME_PLACEHOLDER: Record<FlockGroupType, string> = {
  season: 'مثلاً: گله پاییز ۱۴۰۵',
  breed: 'مثلاً: مرندی‌ها',
  cohort: 'مثلاً: هم‌دوره مرداد',
  farm: 'مثلاً: مزرعه شمال',
  owner: 'مثلاً: گله‌های آقای رضایی',
  custom: 'مثلاً: گله‌های ممتاز',
  smart: 'مثلاً: همه لایه‌های فعال',
};
