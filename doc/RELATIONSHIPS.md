# 🔗 RELATIONSHIPS.md

نسخه 1.0 | ۱۴۰۵/۰۷/۰۷ | v0.9.0

## ۱. هدف
مستندسازی روابط بین ماژول‌ها.
قاعده: هر ماژول می‌تواند از دیگری بخواند ولی نه بنویسد.

## ۲. Cross-Store Reads

| ماژول | می‌خواند از | تعداد |
|-------|-------------|-------|
| dlg | Brd, Egg, Fed, Flk, Hal, Whs | ۶ |
| rep | Brd, Ctc, Dlg, Egg, Flk, Tra | ۶ |
| tra | Ctc, Set, Whs | ۳ |
| egg | Brd, Ctc, Flk | ۳ |
| flk | Brd, Hal | ۲ |
| inc | Brd | ۱ |
| fed | Whs | ۱ |
| whs | Ctc | ۱ |
| cal | Brd, Inc, Dlg, Tra, Whs | ۵ |

## ۳. Foreign Keys

| ماژول | Foreign Keys |
|-------|--------------|
| flk | birdId, breedId, hallId, zoneId, vaccineScheduleId |
| inc | birdId, breedId, deviceId, eggEntryId, hatchGroupId |
| egg | customerId, flockId, logId |
| dlg | flockId, feedSourceId |
| tra | partyId, relatedEntryId, relatedFlockId |
| whs | itemId, partyId, supplierId |
| fed | ingredientId, requirementId, stockItemId |
| brd | birdId |
| hal | hallId |
| alt | sourceId |
| cal | refId |
| doc | linkedId |

## ۴. الگوهای ارتباطی

### Read-Only Cross-Store
در ماژول مبدأ (خواندن):
   import { useFlk } from '../flk/store';
   const { flocks } = useFlk();

قاعده: فقط برای نمایش و فیلتر.

### Entity Link (پیشنهادی)
   <EntityLink type="flock" id={log.flockId} />
   → لینک به /flk?focus=xxx

### URL Filter (پیشنهادی)
   /tra?party=xxx    → فاکتورهای یک مشتری
   /flk?hall=xxx     → گله‌های یک سالن
   /dlg?flock=xxx    → لاگ‌های یک گله

## ۵. فیلترهای وابسته موجود

| فیلد | والد | فایل |
|------|------|------|
| breedId | birdId | FlocksPage, EggEntriesPage, DailyLogsPage |
| zoneId | hallId | FlocksPage |
| flockId | birdId | DailyLogsPage, ProductionsPage |
| unit | category | ItemsPage, MovesPage, IngredientsPage |

## ۶. فیلترهای وابسته غایب

| فیلد | والد | ماژول |
|------|------|-------|
| invoiceId | partyId | tra/ReceivablesPage |
| flockId | hallId | dlg/DailyLogsPage |
| breedId | birdId | rep/ComparePage |

## ۷. ناوبری Cross-Module موجود

- whs/ItemsPage → /tra/purchases
- whs/MovesPage → /tra/purchases

## ۸. ناوبری Cross-Module مورد نیاز

| از | به | شرط |
|-----|-----|------|
| dlg | /flk?focus=xxx | کلیک گله |
| tra | /ctc?focus=xxx | کلیک مشتری |
| egg | /flk?focus=xxx | کلیک گله |
| inc | /brd?focus=xxx | کلیک پرنده |
| flk | /tra?related=xxx | منبع خریداری |

## ۹. کامپوننت‌های پیشنهادی

### EntityLink
   <EntityLink type="flock" id="xxx" label="گله بهار" />

### useUrlFilter
   const [filter, setFilter] = useUrlFilter('party');

### SavedViews
   <SavedViews module="tra" currentFilters={...} onLoad={...} />

## ۱۰. لیست سیاه
- نوشتن در store ماژول دیگر
- Import مستقیم از صفحه‌ی ماژول دیگر
- ناوبری بدون URL
- فیلتر بدون URL param

## ۱۱. لیست سفید
- خواندن از store دیگر
- استفاده از ID مشترک
- ناوبری با URL
- EntityLink
- useUrlFilter

## ۱۲. نقشه راه فاز ۵

| گام | کار |
|-----|------|
| ۵.۱ | این سند |
| ۵.۲ | FILTERS.md |
| ۵.۳ | useUrlFilter |
| ۵.۴ | EntityLink |
| ۵.۵ | SavedViews |
| ۵.۶ | Empty با Action |
| ۵.۷ | Cross-Module Links |

پایان v1.0
