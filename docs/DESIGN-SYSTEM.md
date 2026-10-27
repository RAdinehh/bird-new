# 🎨 DESIGN-SYSTEM.md — Bird-new Design System

> سند مرجع رسمی طراحی نرم‌افزار Bird-new | ۱۴۰۴/۰۸/۰۷

## 📖 مقدمه

Design System **۱۰۰٪ Custom** — بدون هیچ UI library خارجی.

**الهام:** Tailwind (palette/spacing) + Material 3 (semantic/components) + shadcn (variants) + Vaul (bottom-sheet) + Radix (focus trap) + iOS HIG (44px/100dvh) + WCAG 2.1 AA

**سه اصل:** Mobile-First | RTL-Native | Accessibility-First

---

## 🎨 Design Tokens

### Palette پایه (Light)

| Token | Value | Tailwind |
|---|---|---|
| --bg | #f1f5f9 | slate-100 |
| --card | rgba(255,255,255,.95) | — |
| --border | rgba(203,213,225,.7) | slate-300 |
| --text | #0f172a | slate-900 |
| --muted | #64748b | slate-500 |
| --dim | #94a3b8 | slate-400 |

### Semantic

| Token | Value | Tailwind |
|---|---|---|
| --accent | #16a34a | green-600 |
| --accent-soft | rgba(22,163,74,.12) | — |
| --accent-border | rgba(22,163,74,.35) | — |
| --avatar-text | #ffffff | — |
| --warn | #ea580c | orange-600 |
| --danger | #dc2626 | red-600 |
| --info | #0284c7 | sky-600 |
| --purple | #7c3aed | violet-600 |

### ۴ تم Accent

| data-accent | Light | Dark | معنی |
|---|---|---|---|
| green (پیش‌فرض) | green-600 | emerald-500 | 🌱 کشاورزی |
| blue | sky-600 | sky-400 | 💧 آب |
| turquoise | cyan-600 | cyan-400 | 🥚 تخم |
| olive | lime-600 | lime-400 | 🌾 دانه |

### ۱۴ رنگ دسته تجهیزات

| دسته | Tailwind |
|---|---|
| ventilation | blue-600 |
| feeding | amber-600 |
| drinking | cyan-600 |
| heating | red-600 |
| lighting | yellow-600 |
| litter | teal-600 |
| power | orange-600 |
| auxiliary | slate-600 |
| water_treatment | sky-600 |
| safety | red-600 |
| cleaning | violet-600 |
| hand_tools | stone-600 |
| weighing | teal-600 |
| cooling | sky-500 |

### Spacing

| Token | Value |
|---|---|
| --sp-1 | 4px |
| --sp-2 | 8px |
| --sp-3 | 12px |
| --sp-4 | ۱۴px (استثنا) |
| --sp-5 | 16px |
| --sp-6 | 20px |
| --sp-7 | 24px |
| --sp-8 | 32px |

Responsive: compact `max(3px,.8vw)` | normal `max(4px,1vw)`

### Typography — Vazirmatn v33

CSS Defaults:
- --fs-2xs: 10px
- --fs-xs: 11px
- --fs-sm: 12.5px
- --fs-base: 13px
- --fs-md: 14.5px
- --fs-lg: 17px
- --fs-xl: 21px
- --fs-2xl: 25.5px

JS Override: `FB = {xs:12.5, sm:14, base:14.5, md:15.5, lg:17, xl:21, xxl:25.5}` × `sc` (0.9/1/1.1/1.2)

اعداد `.5` برای خوانایی فونت فارسی بهینه شده.

### Radius

| Token | Normal | Compact |
|---|---|---|
| --r-sm | 8px | 6px |
| --r-md | 10px | 8px |
| --r-lg | 12px | 12px |
| --r-xl | 16px | 16px |
| --r-2xl | 20px | — |

### Shadows & Motion & Z-Index

- Shadow: Light `0 8px 24px rgba(15,23,42,.12)` | Dark `0 8px 24px rgba(0,0,0,.4)`
- Durations: fast=150 / base=200 / slow=250 / enter=300 / exit=150 (ms)
- Reduced Motion: همه به `0.01ms`
- Z: header=12 | sticky=20 | fab=30 | drawer=50 | modal=100 | toast=200

---

## 🌗 Themes

- Light: `:root` یا `[data-theme="light"]`
- Dark: `[data-theme="dark"]`
- Auto: `prefers-color-scheme: dark`
- High Contrast: `.pm-high-contrast` روی html

Override Priority:
` :root → [data-theme="dark"] → [data-accent="blue"] → [data-theme="dark"][data-accent="blue"] → .pm-high-contrast `

---

## 🧩 Components Catalog

### Btn
- variant: primary | ghost | danger | outline
- size: sm (32px) | md (38px)

| Variant | BG | Color |
|---|---|---|
| primary | --accent | --avatar-text |
| ghost | --btn-bg | --muted + border |
| danger | --danger | #fff |
| outline | transparent | --accent + border |

DeleteBtn = 44px (iOS HIG touch target).

### Field
Props: label, required, hint, error, warning, onTouch, help, autoFrom, autoHideMs
- error → red border + text (Zod)
- warning → yellow, auto-hide 4000ms
- help → `?` icon (HelpIcon flip-up)
- autoFrom → نشانگر «پر شده از X»

### Input family
NumField، MoneyField، PercentField همه از Input مشتق شده‌اند.
⚠️ AutoClamp حین تایپ ممنوع (L14).

### Select family
- Select → بومی
- SmartSelect → auto-switch (≤۸ بومی، >۸ bottom-sheet)
- DependentSelect → وابسته به والد (bird→breed)

### DatePicker
تقویم شمسی (date-fns-jalali).

### Modal
Props: open, onClose, title, size (sm=320/md=480/lg=640), center, preventClose, footer
- Mobile: bottom-sheet + snap points + drag-to-dismiss
- Desktop: centered modal
- Focus trap + Escape + createPortal

### Toast / ErrorBox / UndoBar
- Toast — پیام کوتاه، z=200
- ErrorBox — پیام قرمز پایین فرم (business logic)
- UndoBar — undo delete

---

## 🎯 Composition Patterns

### Grid2 / Grid3
فیلد کوتاه (عدد، تاریخ) → Grid2. فیلد بلند (متن، آدرس) → تک‌ستونه.

### BtnRow
هر دکمه flex: 1.

### SectionTitle
`border-top: 1px dashed var(--border)`.

### HelpIcon
`<span role="button">` — بدون tap expansion. Flip-up + max-height min(320px, 55dvh).

---

## ♿ Accessibility (WCAG 2.1 AA)

| ویژگی | پیاده‌سازی |
|---|---|
| Touch target | ≥ 44px |
| Reduced motion | 0.01ms |
| Font scaling | تا ±۲۰٪ |
| Contrast | AA (4.5:1 متن، 3:1 UI) |
| Focus visible | outline |
| ARIA | labels + aria-invalid |
| High contrast | .pm-high-contrast |

---

## 📋 Rules

### ✅ DO
- tokens (var(--accent)) — نه hex
- 100dvh نه 100vh
- `role="button"` روی span interactive
- aria-label روی icon buttons
- onTouch روی هر Field
- showError نه vErrors مستقیم

### ❌ DON'T
- hex مستقیم
- 100vh
- autoClamp حین تایپ (L14)
- catch خالی
- tap target < 44px
- as any بدون دلیل
- regex برای JSX

---

## 🎯 For AI — قبل از هر تغییر UI

1. docs/UX-FORM-RULES.md (۷۸ قاعده)
2. docs/DESIGN-SYSTEM.md (این سند)
3. docs/CONSTITUTION.md (L14)
4. الگوی Btn.tsx + Modal.tsx
5. همیشه tokens، هرگز hex

قوانین طلایی: L1 (state از store) | L14 (AutoClamp ممنوع) | Rulebook (۷۸ قاعده)

---

## 📝 تاریخچه

| تاریخ | تغییر |
|---|---|
| ۱۴۰۴/۰۸/۰۷ | نسخه ۱ — استخراج از global.css |

مرجع رسمی Design System. هر تغییر tokens باید اینجا به‌روز شود.
