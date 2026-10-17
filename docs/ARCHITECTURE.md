# 🏛 ARCHITECTURE.md — نقشه کامل Bird-new

> مرجع حقیقت. آخرین اسکن: ۱۴۰۴/۰۷/۲۱ (جلسه ۱۲)

## 📊 آمار کلیدی
- **۱۸ ماژول** · **۳۲۰+ فایل** TS/TSX
- **۱۴ Zustand Store** persist
- **۱۸ Event Type** — ⚠️ فقط ۲ فعال (dlg→flk)
- **۱۷ فایل > ۴۰۰ خط**
- **tsc: 0 خطا** ✅ · **تست: ۱۰۶۸ pass** ✅
- **any: ~۷۱۰ مورد** ⚠️

## 📦 ماژول‌ها

| ماژول | فایل | خط | any | <400 |
|---|---|---|---|---|
| set | 83 | 11885 | 122 🔴 | ❌ store |
| inc | 33 | 6332 | 155 🔴 | ❌ Devices(506), EggEntry(408) |
| flk | 33 | 6215 | 2 ✅ | ❌ store(819), Groups(531), TabPanel(480) |
| hal | 30 | 5804 | 8 | ❌ Zones(444), store(406) |
| tra | 18 | 3152 | 40 | ❌ Receivables(438), Invoice(433) |
| dlg | 20 | 2725 | 25 | ✅ |
| brd | 16 | 2616 | 61 | ✅ |
| dsh | 15 | 2104 | 27 | ❌ useDashboardData(431) |
| fed | 11 | 2101 | 24 | ❌ Ingredients(415) |
| whs | 9 | 2029 | 64 | ❌ Items(424) |
| cal | 9 | 1413 | 16 | ✅ |
| egg | 6 | 1361 | 18 | ❌ Stats(426) |
| rep | 8 | 1203 | 17 | ✅ |
| alt | 5 | 1108 | 12 | ❌ rules(589) |
| doc | 5 | 824 | 0 | ✅ |
| ctc | 6 | 750 | 3 | ✅ |
| arc | 2 | 179 | 0 | ✅ |

## 🔧 shr/ (زیرساخت)

| پوشه | فایل | خط | بزرگ‌ها |
|---|---|---|---|
| components | 47 | 7887 | Charts(487), EditableSelect(428🔒) |
| filter | 23 | 2725 | — |
| validation | 17 | 1615 | — |
| hooks | 16 | 1086 | — |
| utils | 10 | 949 | — |
| search | 4 | 650 | GlobalSearch(418) |
| units | 4 | 390 | — |
| multiSelect | 2 | 342 | — |
| icons | 2 | 440 | — |
| store | 1 | 62 | — |
| data | 1 | 19 | — |

## ⚙️ cor/ (هسته)

| پوشه | فایل | نقش |
|---|---|---|
| events | 5 | Event Bus (۲/۱۸ فعال) |
| ui | 8 | FAB |
| store | 4 | dialog, toast |
| logger | 2 | auditLog |
| router | 1 | AppRouter |
| theme | 1 | applyTheme |

## 💾 Stores (۱۴ persist)

`pm-settings`(122 any) · `pm-brd`(61) · `pm-hal`(8) · `pm-flk`(2) · `pm-inc`(155) · `pm-egg`(18) · `pm-dlg`(25) · `pm-whs`(64) · `pm-fed`(24) · `pm-alt`(12) · `pm-cal-manual`(16) · `pm-ctc`(3) · `pm-tra`(40) · `pm-doc`

## 📮 Event Bus — وضعیت واقعی

**⚠️ فقط `dlg → flk` فعاله!**

| ناشر | ایونت‌ها | emit? | handler? |
|---|---|---|---|
| dlg | ۶ | ✅ (۲ در کد) | ❌ |
| flk | ۳ | ❌ | ✅ (۲ on) |
| tra | ۳ | ❌ | ❌ |
| egg | ۳ | ❌ | ❌ |
| inc | ۲ | ❌ | ❌ |
| whs | ۱ | ❌ | ❌ |

**فایل‌ها:** `cor/events/{bus,events,types,index}.ts` + `DebugPanel.tsx`
**سند:** `docs/EVENT-BUS.md` (باید آپدیت شه)

## 👥 سیستم گروه‌بندی گله (flk)

**تایپ‌ها:** `FlockGroup` + `FlockGroupRule` + `FlockGroupMember`
**نوع‌ها:** `season · breed · cohort · farm · owner · custom · smart`
**وضعیت:** `active · archived · sold · merged`
**معامله:** `own · partnership · consignment · rent`

**فایل‌ها (۹):**
GroupsPage(531) · FlockGroupsModal · MergeFlocksModal · GroupTimeline · GroupComparisonModal · GroupReportModal · useGroupKpi · FlockDealSection · useTabBadge

## 🔗 وابستگی

~~~
set ← پایه
  ↓
brd ← hal, flk, egg, inc, tra, alt, rep
  ↓
hal ← flk
  ↓
whs ← tra, egg, fed, dlg, hal
~~~

**استثنا:** `set → hal` (HiddenOptionsTab — decision رها شد)

## ⚠️ فایل‌های > ۴۰۰ خط (۱۷ مورد)

| # | فایل | خط | اولویت |
|---|---|---|---|
| ۱ | flk/store.ts | 819 | 🔴 |
| ۲ | alt/rules.ts | 589 | 🔴 |
| ۳ | flk/GroupsPage.tsx | 531 | 🔴 |
| ۴ | inc/DevicesPage.tsx | 506 | 🔴 |
| ۵ | shr/Charts.tsx | 487 | 🟡 |
| ۶ | flk/FlockTabPanel.tsx | 480 | 🔴 |
| ۷ | hal/ZonesPage.tsx | 444 | 🔴 |
| ۸ | tra/ReceivablesPage.tsx | 438 | 🟡 |
| ۹ | tra/InvoicePage.tsx | 433 | 🟡 |
| ۱۰ | dsh/useDashboardData | 431 | 🟡 |
| ۱۱ | shr/EditableSelect.tsx | 428 | 🔒 |
| ۱۲ | egg/StatsPage.tsx | 426 | 🟡 |
| ۱۳ | whs/ItemsPage.tsx | 424 | 🟡 |
| ۱۴ | shr/GlobalSearch.tsx | 418 | 🟡 |
| ۱۵ | fed/IngredientsPage.tsx | 415 | 🟡 |
| ۱۶ | inc/EggEntryModal.tsx | 408 | 🔴 |
| ۱۷ | hal/store.ts | 406 | 🔴 |

## 🚨 بدهی فنی (به ترتیب اولویت)

| # | کار | مقدار | ریسک |
|---|---|---|---|
| ۱ | Event Bus فعال‌سازی | ۱۶/۱۸ غیرفعال | 🔴 |
| ۲ | showAlert → Toast | ۱۵ مورد | 🟡 |
| ۳ | catch خالی hal | ۷ مورد | 🔴 |
| ۴ | any در inc | ۱۵۵ | 🔴 |
| ۵ | any در set | ۱۲۲ | 🟡 |
| ۶ | refactor flk/store | 819 خط | 🟡 |
| ۷ | refactor alt/rules | 589 خط | 🟡 |

## 📚 اسناد

| سند | نقش | وضعیت |
|---|---|---|
| HANDOFF.md | وضعیت + برنامه | ✅ |
| FOUNDATION.md | قوانین آهنین | ✅ |
| FOUNDATION-PATTERNS.md | الگوهای تفکر | ✅ |
| EVENT-BUS.md | قرارداد ایونت | 🟡 آپدیت لازم |
| AUDIT.md | چک‌لیست | ✅ |
| TYPE-REGISTRY.md | تایپ‌ها | 🟡 آپدیت لازم |
| UX-FORM-RULES.md | ۷۰ دستور | ✅ |

---

*این سند منبع حقیقت است. با هر تغییر ساختاری به‌روز شه.*
