# 📋 Audit Report: `dsh`

**مسیر:** `src/mod/dsh`  
**فایل‌ها:** 9  

## خلاصه


- 🟢 **Low**: 70
- 🟡 **Medium**: 25
---


## 🎨 A. بصری و طراحی

- 🟡 `ListCards.tsx` — **inline style زیاد** — `31 مورد (آستانه: 15)`
- 🟡 `TodayCard.tsx` — **inline style زیاد** — `18 مورد (آستانه: 15)`
- 🟡 `TopAlerts.tsx` — **inline style زیاد** — `22 مورد (آستانه: 15)`
- 🟢 `AnalyticsCards.tsx:92` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `AnalyticsCards.tsx:216` — **grid/flex بدون gap** — `display: 'flex', justifyContent: 'space-between', alignItems: 'center',`
- 🟢 `AnalyticsCards.tsx` — **بدون overflow handling** — ``
- 🟢 `BenchmarkCard.tsx:42` — **grid/flex بدون gap** — `<div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'va`
- 🟢 `BenchmarkCard.tsx:59` — **grid/flex بدون gap** — `<div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', fontSize: 'var(--`
- 🟢 `ListCards.tsx:63` — **fontSize ثابت** — `<span style={{ fontSize: 16, flexShrink: 0 }}>{LEVEL_ICON[a.level]}</span>`
- 🟢 `ListCards.tsx:129` — **fontSize ثابت** — `fontSize: 16, flexShrink: 0`
- 🟢 `ListCards.tsx:195` — **fontSize ثابت** — `fontSize: 16, flexShrink: 0`
- 🟢 `ListCards.tsx:38` — **grid/flex بدون gap** — `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px `
- 🟢 `ListCards.tsx:90` — **grid/flex بدون gap** — `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px `
- 🟢 `ListCards.tsx:128` — **grid/flex بدون gap** — `display: 'flex', alignItems: 'center', justifyContent: 'center',`
- 🟢 `ListCards.tsx:160` — **grid/flex بدون gap** — `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px `
- 🟢 `ListCards.tsx:194` — **grid/flex بدون gap** — `display: 'flex', alignItems: 'center', justifyContent: 'center',`
- 🟢 `ListCards.tsx:225` — **grid/flex بدون gap** — `display: 'flex', justifyContent: 'space-between', alignItems: 'center',`
- 🟢 `ListCards.tsx:43` — **آیکون جهت‌دار (RTL)** — `مشاهده همه ←`
- 🟢 `ListCards.tsx:95` — **آیکون جهت‌دار (RTL)** — `مشاهده همه ←`
- 🟢 `ListCards.tsx:165` — **آیکون جهت‌دار (RTL)** — `مشاهده ←`
- 🟢 `QuickActions.tsx:18` — **fontSize ثابت** — `<div style={{ fontSize: 22 }}>{icon}</div>`
- 🟢 `QuickActions.tsx` — **بدون overflow handling** — ``
- 🟢 `TodayCard.tsx:50` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `TodayCard.tsx:146` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `TodayCard.tsx:71` — **عرض ثابت بزرگ** — `maxWidth: 140,`
- 🟢 `TodayCard.tsx` — **بدون overflow handling** — ``
- 🟢 `TopAlerts.tsx:164` — **fontSize ثابت** — `<div style={{ fontSize: 48, marginBottom: 12 }}>🐔</div>`
- 🟢 `TopAlerts.tsx:57` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `TopAlerts.tsx:95` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `TopAlerts.tsx:136` — **grid/flex بدون gap** — `display: 'flex',`
- 🟢 `TopAlerts.tsx:159` — **spacing بزرگ ثابت** — `padding: 24, textAlign: 'center',`
- 🟢 `TopAlerts.tsx:166` — **عرض ثابت بزرگ** — `<div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 300, margi`
- 🟢 `cards.tsx:35` — **fontSize ثابت** — `<span style={{ fontSize: 16 }}>{icon}</span>`

## 🧩 B. ساختار و کامپوننت

- 🟡 `ListCards.tsx` — **کارت inline بدون ExpandableCard** — `3 مورد`
- 🟢 `Dashboard.tsx` — **خط تکراری ×3** — `const last7 = logs.filter(l => dateDiffDays(l.date) <= 7);`
- 🟢 `ListCards.tsx` — **خط تکراری ×3** — `<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'cen`
- 🟢 `ListCards.tsx` — **خط تکراری ×3** — `<span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' `
- 🟢 `ListCards.tsx` — **خط تکراری ×3** — `border: '1px solid var(--border)',`
- 🟢 `ListCards.tsx` — **خط تکراری ×3** — `<div style={{ flex: 1, minWidth: 0 }}>`
- 🟢 `ListCards.tsx` — **خط تکراری ×3** — `fontSize: 'var(--fs-sm)', fontWeight: 600,`
- 🟢 `TopAlerts.tsx` — **خط تکراری ×3** — `justifyContent: 'space-between',`

## 🧮 C. داده و منطق

- 🟢 `utils.ts:32` — **Date.now() بدون jalali** — `return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));`

## 🎯 D. تعامل کاربر

- · `AnalyticsCards.tsx` — **قابلیت export/print دارد** — ``
- · `BenchmarkCard.tsx` — **قابلیت export/print دارد** — ``
- · `Dashboard.tsx` — **قابلیت export/print دارد** — ``
- · `ListCards.tsx` — **قابلیت export/print دارد** — ``
- · `QuickActions.tsx` — **قابلیت export/print دارد** — ``
- · `TodayCard.tsx` — **قابلیت export/print دارد** — ``
- · `TopAlerts.tsx` — **قابلیت export/print دارد** — ``
- · `cards.tsx` — **قابلیت export/print دارد** — ``
- · `utils.ts` — **قابلیت export/print دارد** — ``

## 🔧 E. کیفیت فنی

- 🟡 `AnalyticsCards.tsx` — **نقض تایپ: : any** — `3 مورد`
- 🟡 `BenchmarkCard.tsx` — **نقض تایپ: : any** — `1 مورد`
- 🟡 `Dashboard.tsx` — **نقض تایپ: as any** — `1 مورد`
- 🟡 `Dashboard.tsx` — **نقض تایپ: : any** — `8 مورد`
- 🟡 `ListCards.tsx` — **نقض تایپ: : any** — `5 مورد`
- 🟡 `TodayCard.tsx` — **نقض تایپ: : any** — `2 مورد`
- 🟡 `TopAlerts.tsx` — **نقض تایپ: : any** — `9 مورد`

## ♿ F. دسترس‌پذیری

- 🟡 `AnalyticsCards.tsx:103` — **button بدون aria-label** — `                        <button`
- 🟢 `AnalyticsCards.tsx` — **onClick زیاد بدون role** — ``
- 🟢 `AnalyticsCards.tsx` — **بدون focus management** — ``
- 🟢 `BenchmarkCard.tsx` — **بدون focus management** — ``
- 🟢 `Dashboard.tsx` — **بدون focus management** — ``
- 🟢 `ListCards.tsx` — **onClick زیاد بدون role** — ``
- 🟢 `ListCards.tsx` — **بدون focus management** — ``
- 🟢 `ListCards.tsx` — **تاریخ بدون اشاره shamsi** — ``
- 🟢 `QuickActions.tsx` — **onClick زیاد بدون role** — ``
- 🟢 `QuickActions.tsx` — **بدون focus management** — ``
- 🟢 `TodayCard.tsx` — **onClick زیاد بدون role** — ``
- 🟢 `TodayCard.tsx` — **بدون focus management** — ``
- 🟢 `TopAlerts.tsx` — **بدون focus management** — ``
- 🟢 `cards.tsx` — **بدون focus management** — ``
- 🟢 `utils.ts` — **بدون focus management** — ``

## 🔒 G. امنیت و داده

✅ بدون مشکل


## 🎬 H. تجربه کلی

- 🟡 `AnalyticsCards.tsx` — **بدون Empty state** — ``
- 🟡 `BenchmarkCard.tsx` — **بدون Empty state** — ``
- 🟡 `Dashboard.tsx` — **بدون Empty state** — ``
- 🟡 `Dashboard.tsx` — **بدون error state** — ``
- 🟡 `ListCards.tsx` — **بدون Empty state** — ``
- 🟡 `TodayCard.tsx` — **بدون Empty state** — ``
- 🟡 `TopAlerts.tsx` — **بدون Empty state** — ``

## 🔗 I. ارتباطات

- 🟡 `Dashboard.tsx` — **cross-module زیاد** — `9 store`
- 🟢 `AnalyticsCards.tsx` — **import عمیق cross-module** — `../../shr/components/Charts`
- 🟢 `AnalyticsCards.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `BenchmarkCard.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `Dashboard.tsx` — **import عمیق cross-module** — `../../shr/components/ui`
- 🟢 `Dashboard.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `ListCards.tsx` — **import عمیق cross-module** — `../../shr/components/ui`
- 🟢 `ListCards.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `QuickActions.tsx` — **import عمیق cross-module** — `../../shr/components/ui`
- 🟢 `TodayCard.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `TopAlerts.tsx` — **import عمیق cross-module** — `../../shr/components/ui`
- 🟢 `TopAlerts.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`
- 🟢 `cards.tsx` — **import عمیق cross-module** — `../../shr/utils/fa`

## 📚 J. مستندسازی

- 🟡 `AnalyticsCards.tsx:55` — **nesting عمیق** — `عمق 8`
- 🟡 `ListCards.tsx:37` — **nesting عمیق** — `عمق 7`
- 🟡 `QuickActions.tsx:32` — **nesting عمیق** — `عمق 7`
- 🟡 `TodayCard.tsx:42` — **nesting عمیق** — `عمق 8`
- 🟡 `TopAlerts.tsx:33` — **nesting عمیق** — `عمق 7`
- 🟢 `AnalyticsCards.tsx:131` — **ternary تودرتو** — `color={fcr === 0 ? 'info' : fcr <= 1.9 ? 'accent' : fcr <= 2.3 ? 'warn' : 'dange`
- 🟢 `Dashboard.tsx:89` — **تابع طولانی (>100 خط)** — ``
- 🟢 `Dashboard.tsx:333` — **تابع طولانی (>100 خط)** — ``
- 🟢 `TopAlerts.tsx:85` — **ternary تودرتو** — `const tone = (days ?? 0) < 0 ? 'danger' : (days ?? 0) <= 2 ? 'warn' : 'amber';`
- 🟢 `TopAlerts.tsx:106` — **ternary تودرتو** — `{(days ?? 0) < 0 ? `${toFa(Math.abs(days ?? 0))} روز گذشته` : (days === 0 ? 'امر`
- 🟢 `utils.ts` — **توابع بدون JSDoc** — `6 تابع`
- · `Dashboard.tsx` — **بخش‌بندی با ==** — `10 بخش`