# 🎛 FILTERS.md — استاندارد فیلترها

نسخه 1.0 | ۱۴۰۵/۰۷/۰۷

## ۱. هدف
استانداردسازی فیلترها در همه ماژول‌ها.

## ۲. اصول

- هر فیلتر = URL param (share-able)
- ذخیره خودکار در localStorage
- Back button کار کنه
- فیلترهای وابسته با DependentSelect
- فیلترهای >۸ آیتم با SmartSelect

## ۳. الگوی URL

ماژول tra:
  /tra                → همه
  /tra?party=xxx      → فاکتورهای یک مشتری
  /tra?type=sale      → فقط فروش
  /tra?from=1405/01/01&to=1405/07/07  → بازه
  /tra?status=draft   → پیش‌نویس

ترکیب با &:
  /tra?party=xxx&type=sale

## ۴. الگوی Hook

  const [party, setParty] = useUrlFilter('party');
  → URL: /tra?party=xxx
  → Back button: کار می‌کنه
  → ذخیره: pm-filter-tra

## ۵. UI استاندارد

### FilterBar
بالای صفحه، نوار افقی با چیپ‌ها:
  [مشتری: احمد ✕] [فروش ✕] [+ فیلتر]

### FilterChip
  - رنگ: accent
  - ✕ حذف فیلتر
  - کلیک → منوی گزینه‌ها

### SavedViews
  دکمه «ذخیره» → نام بده → ذخیره
  لیست پایین → انتخاب → بارگذاری

## ۶. لیست فیلترها

### tra
- partyId, type, from, to, status

### flk
- hallId, birdId, status, type

### dlg
- flockId, date, from, to

### whs
- category, itemId, type

### egg
- flockId, from, to

### rep
- from, to, flockId, type

## ۷. لیست سیاه
- فیلتر بدون URL
- فیلتر بدون UI چیپ
- استفاده state محلی برای فیلتر share-able

## ۸. لیست سفید
- useUrlFilter برای همه فیلترها
- FilterChip برای نمایش
- SavedViews برای ذخیره
- DependentSelect برای وابستگی

## ۹. نقشه راه
- ۵.۲ این سند
- ۵.۳ useUrlFilter
- ۵.۴ FilterBar + FilterChip
- ۵.۵ SavedViews

پایان v1.0
