/**
 * data-ownership.ts — مالکیت داده‌ها (طبق NAVFarm)
 *
 * قانون ۱۶ FOUNDATION: Master Data vs Operations
 *   - هر داده یه مالک داره (master module)
 *   - Operations فقط مصرف‌کننده‌ست
 */

export const DATA_OWNERS = {
  /** گونه‌های پرنده (chicken, duck, ...) */
  species: 'set',
  /** استانداردهای نژاد (FCR, env, feed, ...) */
  breedStandard: 'set',
  /** پرنده‌های کاربر */
  bird: 'brd',
  /** نژادهای کاربر */
  breed: 'brd',
  /** گله‌ها */
  flock: 'flk',
  /** سالن‌ها */
  hall: 'hal',
  /** معاملات */
  trade: 'tra',
} as const;

export type DataEntity = keyof typeof DATA_OWNERS;

/** گرفتن مسیر Master برای هر entity */
export function getMasterPath(entity: DataEntity): string {
  switch (entity) {
    case 'species':
    case 'breedStandard':
      return '/set?tab=config';
    case 'bird':
    case 'breed':
      return '/brd';
    case 'flock':
      return '/flk';
    case 'hall':
      return '/hal';
    case 'trade':
      return '/tra';
    default:
      return '/';
  }
}

/** چک: آیا این ماژول مالک داده‌ست؟ */
export function isOwner(entity: DataEntity, module: string): boolean {
  return DATA_OWNERS[entity] === module;
}

/** پیام کاربرپسند برای «برو Master» */
export function getMasterMessage(entity: DataEntity): string {
  switch (entity) {
    case 'species':
      return 'برای افزودن پرنده‌ی جدید، از مدیریت پرنده‌ها استفاده کن';
    case 'breedStandard':
      return 'برای ساخت این نژاد، برو تنظیمات → استانداردها';
    default:
      return 'برای این کار به بخش مدیریت برو';
  }
}
