setup.sh0x
#!/bin/bash
# ============================================================
# اسکریپت راه‌اندازی پروژه مدیریت مرغداری
# ============================================================

echo "📁 ساخت ساختار پوشه‌ها..."
mkdir -p doc
mkdir -p src/cor/{config,database,router,store,backup,logger}
mkdir -p src/shr/{components,hooks,utils,types,styles}
mkdir -p src/mod
mkdir -p public

# ============================================================
# فایل ۱: DESIGN.md
# ============================================================
echo "📝 نوشتن DESIGN.md..."
cat > doc/DESIGN.md << 'DESIGN_EOF'
# DESIGN.md — سند سیستم طراحی

نسخه: ۱.۰
تاریخ: ۱۴۰۵/۰۷/۰۴
وضعیت: قفل‌شده — مرجع اصلی طراحی

## ۱. فلسفه

۱. کاربر پسند — هر تصمیم با معیار «آیا کاربر راحت‌تر می‌شود؟»
۲. انعطاف کامل — هیچ چیز هاردکد نیست
۳. الگوگیری از استاندارد جهانی — بدون سلیقه‌ی شخصی
۴. سازگاری با ایران — شمسی، فارسی، RTL، متریک
۵. Progressive Disclosure — کارت بسته خلاصه، لمس → جزئیات

## ۲. مراجع

| مرجع | کاربرد |
|---|---|
| Apple HIG | لمس، Bottom Nav، Modal |
| Material Design 3 | فرم، Button، Motion |
| SAP Fiori | Progressive Disclosure |
| Petersime/Pas Reform | استاندارد جوجه‌کشی |
| WCAG 2.1 AA | دسترسی‌پذیری |

## ۳. توکن‌ها

### ۳.۱ رنگ — تم روشن

--bg: #f1f5f9;
--card: rgba(255,255,255,.95);
--card-solid: #ffffff;
--border: rgba(203,213,225,.7);
--text: #0f172a;
--muted: #64748b;
--dim: #94a3b8;
--accent: #16a34a;
--accent-soft: rgba(22,163,74,.12);
--accent-border: rgba(22,163,74,.35);
--warn: #d97706;
--warn-soft: rgba(217,119,6,.12);
--danger: #dc2626;
--danger-soft: rgba(220,38,38,.12);
--info: #0284c7;
--info-soft: rgba(2,132,199,.12);
--purple: #7c3aed;
--purple-soft: rgba(124,58,237,.12);
--header-bg: rgba(241,245,249,.95);
--btn-bg: rgba(255,255,255,.9);
--input-bg: rgba(241,245,249,.7);
--avatar-text: #ffffff;
--overlay: rgba(15,23,42,.5);
--ring-track: rgba(203,213,225,.9);
--shadow: 0 8px 24px rgba(15,23,42,.12);

### ۳.۲ رنگ — تم تیره

--bg: #0f172a;
--card: rgba(30,41,59,.65);
--card-solid: #1e293b;
--border: rgba(51,65,85,.55);
--text: #e2e8f0;
--muted: #94a3b8;
--dim: #64748b;
--accent: #22c55e;
--accent-soft: rgba(34,197,94,.15);
--accent-border: rgba(34,197,94,.4);
--warn: #f59e0b;
--danger: #ef4444;
--info: #38bdf8;
--purple: #a78bfa;
--header-bg: rgba(15,23,42,.95);
--btn-bg: rgba(30,41,59,.6);
--input-bg: rgba(15,23,42,.5);
--avatar-text: #0f172a;
--overlay: rgba(0,0,0,.6);
--ring-track: rgba(51,65,85,.7);
--shadow: 0 8px 24px rgba(0,0,0,.4);

### ۳.۳ فاصله (Spacing Scale)

--sp-1: 4px;
--sp-2: 8px;
--sp-3: 12px;
--sp-4: 14px;
--sp-5: 16px;
--sp-6: 20px;
etup.sh0x0x
--sp-7: 24px;
--sp-8: 32px;

قانون: فقط از این مقادیر. margin دستی ممنوع.

### ۳.۴ فونت (Typography Scale)

--fs-xs: 10px;
--fs-sm: 11px;
--fs-base: 12.5px;
--fs-md: 13.5px;
--fs-lg: 15px;
--fs-xl: 18px;
--fs-2xl: 22px;

فونت: Vazirmatn از CDN

### ۳.۵ گوشه (Radius Scale)

--r-sm: 8px;
--r-md: 10px;
--r-lg: 12px;
--r-xl: 16px;
--r-2xl: 20px;

### ۳.۶ Z-index Layers

--z-base: 1;
--z-dropdown: 10;
--z-header: 12;
--z-sticky: 20;
--z-fab: 30;
--z-drawer: 50;
--z-drawer-content: 51;
--z-modal: 100;
--z-toast: 200;

### ۳.۷ انیمیشن (Motion Tokens)

--ease-out: cubic-bezier(.16,1,.3,1);
--ease-in: cubic-bezier(.4,0,1,1);
--ease-standard: cubic-bezier(.4,0,.2,1);

--dur-fast: 150ms;
--dur-base: 200ms;
--dur-slow: 250ms;
--dur-enter: 300ms;
--dur-exit: 150ms;

## ۴. کامپوننت‌های پایه

### Button

انواع: primary, ghost, danger, outline, sm
ارتفاع: 38px (پیش‌فرض), 32px (sm)
گوشه: --r-md

RTL: تأیید راست، لغو چپ
.btn-row{display:flex;flex-direction:row-reverse;gap:var(--sp-2)}

### Input

ارتفاع 38px، پس‌زمینه --input-bg، گوشه --r-md
حالت‌ها: focus, error (قرمز), warn (کهربایی)

مقاوم‌سازی:
.form-group{min-width:0}
.input{width:100%;min-width:0;overflow:hidden}
.input input{flex:1 1 0%;width:100%;min-width:0}

### Card

item-card با نوار رنگی راست (4px)
رنگ‌ها: accent (فعال), warn (هشدار), dim (خاموش), purple (Hatcher)

متن بلند: ellipsis اجباری
.item-title,.item-sub{
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}

### Modal

از پایین، گوشه بالا 20px، max 90vh
انیمیشن: slideUp 300ms ease-out
Focus trap اجباری
Esc → بستن

### Drawer

از راست (RTL)، عرض 290px، max 85vw

### Toast

بالا وسط، زیر هدر
ورود: translateY(8px) + scale(.98) → 0 + 1
مدت: 2500ms

قانون: بدون translateY(-20px) — پرش می‌سازد

### Tabs (زیرخطی)

.tab-item.active{color:var(--accent);position:relative}
.tab-item.active::after{
  content:"";position:absolute;bottom:0;
  right:10px;left:10px;height:2.5px;
  background:var(--accent);border-radius:3px 3px 0 0;
}

### Calendar

الزامی:
- انتخاب سال (dropdown)
- انتخاب ماه (dropdown)
- نمایش تاریخ انتخاب‌شده
- جمعه قرمز، امروز سبز، انتخاب‌شده پر

### حلقه پیشرفت

قطر 38px، SVG
انیمیشن: stroke-dashoffset 600ms ease-out

## ۵. الگوهای چیدمان

### Header
چسبیده. منو (چپ) + عنوان (وسط) + تم + اعلان (راست).
بدون فلش بازگشت — کاربر با Back اندروید.

### Bottom Navigation
۵ آیتم: داشبورد، ثبت روزانه، جوجه‌کشی، گزارش، تنظیمات
آیتم فعال: pill سبز محو + متن سبز

### FAB
قطر 52px، bottom:90px; left:16px
فقط در: brd, hal, flk, inc, cus, wrk, whs, med

## ۶. قواعد فرم

### تک‌ستونه vs دو‌ستونه

| فیلد | چیدمان |
|---|---|
| عدد کوتاه | ۲ ستونه |
| تاریخ | ۲ ستونه |
| درصد، دما | ۲ ستونه |
| سال/ماه/روز | ۳ ستونه |
| نام | ۱ ستونه |
| آدرس، یادداشت | ۱ ستونه |
| چیپ | ۱ ستونه |
| فیلد وابسته | ۱ ستونه |

### گرید آماده
.form-grid{display:grid;gap:var(--sp-2);min-width:0}
.grid-2{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.grid-3{grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)}
.form-grid > *{min-width:0}

### فیلد وابسته

پرنده → نژاد (فقط نژادهای همان پرنده)
معامله → فیلدهای مخصوص

.dependent-block{
  display:grid;
  grid-template-rows:0fr;
  transition:grid-template-rows var(--dur-slow) var(--ease-out);
  will-change:grid-template-rows;
}
.dependent-block.open{grid-template-rows:1fr}
.dependent-inner{overflow:hidden}
.dependent-content{
  padding-top:var(--sp-3);
  opacity:0;
  transform:translateY(4px);
  transition:opacity var(--dur-base) var(--ease-out),
             transform var(--dur-base) var(--ease-out);
}
.dependent-block.open .dependent-content{
  opacity:1;transform:translateY(0);
  transition-delay:80ms;
}

قانون: translateY کمتر از ۴px ممنوع

### اعداد فارسی

toFa() — نمایش
toEn() — ذخیره
numFa() — با جداکننده هزار

ورودی اعداد: dir="ltr" inputmode="numeric"

## ۷. انیمیشن — اصول

۱. translateY کمتر از ۴px ممنوع
۲. خروج نصف ورود
۳. ease-out ورود، ease-in خروج
۴. prefers-reduced-motion پشتیبانی
۵. will-change روی grid

جدول:
| تعامل | مدت | Easing |
|---|---|---|
| فیلد وابسته | ۲۵۰ms | ease-out |
| کارت بازشو | ۲۵۰ms | ease-out |
| Modal ورود | ۳۰۰ms | ease-out |
| Toast | ۲۰۰ms | ease-out |
| Checkbox | ۱۵۰ms | ease-out |
| Button | ۱۰۰ms | standard |
| حلقه | ۶۰۰ms | ease-out |

@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    transition-duration:.01ms !important;
    animation-duration:.01ms !important;
  }
}

## ۸. RTL

- html lang="fa" dir="rtl"
- لیبل راست‌چین
- واحد سمت چپ
- ورودی اعداد dir="ltr"
- دکمه‌ها: تأیید راست، لغو چپ
- font-variant-numeric: tabular-nums

## ۹. دسترسی‌پذیری

- لمس حداقل ۴۴×۴۴px
- کنتراست ۴.۵:۱
- ARIA روی آیکون‌ها
- Focus trap در Modal
- Esc → بستن
- رنگ تنها حامل معنا نباشد

## ۱۰. تم

۲ تم: light (پیش‌فرض)، dark
افزودن = ۱۵ خط CSS
ذخیره در localStorage با کلید pm-theme

## ۱۱. لیست سیاه

| ممنوع | دلیل |
|---|---|
| position:absolute برای فیلد بازشو | layout shift |
| margin دستی | gap جایگزین |
| رنگ هاردکد | CSS var جایگزین |
| translateY(-6px) | پرش |
| display:none/block برای انیمیشن | پرش |
| z-index خارج توکن | به‌هم‌ریختگی |
| فونت کمتر از --fs-xs | ناخوانا |
| لمس کمتر از ۴۴px | خطای کاربر |
| !important | جایگزین نکن |
| انیمیشن بیشتر از ۳۰۰ms | کندی |
DESIGN_EOF

# ============================================================
# فایل ۲: SCHEMA.md
# ============================================================
echo "📝 نوشتن SCHEMA.md..."
cat > doc/SCHEMA.md << 'SCHEMA_EOF'
# SCHEMA.md — ساختار داده

نسخه: ۱.۰
وضعیت: قفل‌شده — مرجع داده

## قوانین پایه

۱. هر رکورد: id (UUID), createdAt, updatedAt
۲. هیچ فیلد مشتق‌شده ذخیره نمی‌شود (محاسبه در runtime)
۳. حذف نرم — isDeleted flag
۴. آرشیو — archivedAt
۵. شمارنده — order برای مرتب‌سازی دستی

## ساختار پشتیبان

{
  version: 1,
  schemaVersion: 1,
  exportedAt: "ISO date",
  checksum: "sha256",
  data: {
    birds: [],
    breeds: [],
    halls: [],
    flocks: [],
    devices: [],
    dailyLogs: [],
    warehouses: [],
    invoices: [],
    settings: {}
  }
}

## موجودیت‌ها

### ۱. Bird (پرنده)

{
  id: "uuid",
  name: "مرغ",
  nameEn: "Chicken",
  icon: "🐔",       // اختیاری
  color: "#hex",     // اختیاری
  cycleDays: 500,    // چرخه زندگی
  fcrStandard: 2.0,  // FCR مرجع
  notes: "",
  createdAt, updatedAt,
  isDeleted: false,
  order: 0
}

### ۲. Breed (نژاد)

{
  id: "uuid",
  birdId: "uuid",    // FK → Bird
  name: "لگهورن",
  fcr: 1.85,
  notes: "",
  createdAt, updatedAt,
  isDeleted: false
}

### ۳. Hall (سالن)

{
  id: "uuid",
  name: "سالن شمالی",
  code: "H-01",
  length: 12,      // متر
  width: 8,
  height: 3,
  capacity: 1000,  // پرنده
  targetTemp: 22,
  targetHumidity: 60,
  ventilation: 12, // m³/min
  light: 20,       // lux
  address: "",
  builtAt: "ISO date",
  lastSanitizedAt: "ISO date",
  notes: "",
  createdAt, updatedAt,
  isDeleted: false
}

### ۴. Zone (بخش داخل سالن)

{
  id: "uuid",
  hallId: "uuid",
  name: "بخش A",
  capacity: 300,
  notes: "",
  createdAt, updatedAt
}

### ۵. Equipment (تجهیزات سالن)

{
  id: "uuid",
  hallId: "uuid",
  type: "lamp" | "fan" | "heater" | "cooler" | "drinker" | "feeder" | "camera" | "sensor" | "other",
  name: "لامپ LED",
  count: 10,
  price: 150000,
  purchasedAt: "ISO",
  notes: "",
  createdAt, updatedAt
}

### ۶. Flock (گله)

{
  id: "uuid",
  name: "گله بهار",
  birdId: "uuid",
  breedId: "uuid",
  hallId: "uuid|null",
  zoneId: "uuid|null",
  count: 850,
  startDate: "ISO",
  endDate: "ISO|null",
  type: "layer" | "broiler" | "breeder",
  status: "active" | "archived" | "sold",
  maleCount: 0,     // برای گله مادر
  femaleCount: 0,
  notes: "",
  createdAt, updatedAt,
  isDeleted: false
}

### ۷. Device (دستگاه جوجه‌کشی)

{
  id: "uuid",
  name: "دستگاه ۱",
  capacity: 500,    // تخم مرغ استاندارد
  mode: "setter" | "hatcher" | "setter+hatcher",
  status: "active" | "idle" | "broken" | "maintenance",
  capacityFactors: { // ضریب برای هر پرنده
    "birdId": 0.8
  },
  temp: 37.8,
  humidity: 55,
  rotationEnabled: true,
  purchasedAt: "ISO",
  price: 0,
  notes: "",
  createdAt, updatedAt,
  isDeleted: false
}

### ۸. HatchGroup (گروه هچ)

{
  id: "uuid",
  name: "بچ ۱۴۰۵/۰۷",
  targetHatchDate: "ISO",
  status: "active" | "completed" | "cancelled",
  notes: "",
  createdAt, updatedAt
}

### ۹. EggEntry (ورودی تخم به دستگاه)

{
  id: "uuid",
  deviceId: "uuid",
  hatchGroupId: "uuid",
  birdId: "uuid",
  breedId: "uuid",
  count: 300,
  entryDate: "ISO",
  source: "own" | "external" | "purchased",
  dealType: "personal" | "partnership" | "rent" | "consignment",
  dealData: {       // فیلدهای وابسته
    partnerName: "",
    partnerPercent: 50,
    partnerPhone: "",
    rentAmount: 0,
    rentDueDate: "ISO",
    consigneeName: "",
    consigneePercent: 20
  },
  trayNumbers: [1, 2],
  notes: "",
  createdAt, updatedAt
}

### ۱۰. Candling (کندلینگ)

{
  id: "uuid",
  eggEntryId: "uuid",
  stage: 1 | 2 | 3,   // روز ۷، ۱۲، ۱۸
  date: "ISO",
  alive: 280,
  infertile: 15,
  dead: 5,
  broken: 0,
  reasons: {
    infertile: "season|rooster_age|nutrition|genetics",
    dead: "temp|humidity|ventilation|genetics",
    broken: "handling|rotation|transport"
  },
  notes: "",
  createdAt
}

### ۱۱. Hatch (هچ نهایی)

{
  id: "uuid",
  eggEntryId: "uuid",
  date: "ISO",
  hatched: 250,
  unhatched: 50,
  unhatchedReasons: {
    dead_in_shell: 30,
    pipped: 10,
    other: 10
  },
  notes: "",
  createdAt
}

### ۱۲. DailyLog (ثبت روزانه)

{
  id: "uuid",
  flockId: "uuid|null",
  hallId: "uuid|null",
  date: "ISO",
  time: "HH:MM",

  // شرایط محیطی
  temp: 22.5,
  humidity: 60,
  ventilation: "ok" | "low" | "high",
  airQuality: "good" | "bad",
  light: 20,
  litter: "dry" | "wet" | "clumped",

  // مشاهده پرنده
  behavior: "active" | "lethargic" | "excited",
  distribution: "uniform" | "cornered",
  appearance: "",
  sound: "normal" | "cough" | "sneeze",

  // مصرف
  feedType: "",
  feedAmount: 50,     // کیلو
  feedRemaining: 0,
  waterAmount: 100,   // لیتر
  waterQuality: "good" | "bad",

  // تلفات
  deaths: 2,
  deathsDetail: [{ birdId, breedId, sex, age, weight, time, location, condition, cause, notes }],

  // سلامت
  vaccines: [{ name, dose, method, time, count, batchNo, expireAt, reaction }],
  medications: [{ name, dose, method, time, withdrawalDays }],

  // فعالیت‌ها
  activities: [{ type, notes }],

  // مشاهدات آزاد
  notes: "",
  photos: [],

  createdAt, updatedAt
}

### ۱۳. WarehouseItem (قلم انبار)

{
  id: "uuid",
  name: "ذرت",
  category: "feed" | "medicine" | "equipment" | "consumable",
  unit: "kg" | "L" | "pcs",
  code: "",
  currentStock: 500,
  minStock: 100,
  maxStock: 1000,
  lastPrice: 12000,
  avgPrice: 11500,
  expireAt: "ISO|null",
  supplier: "",
  notes: "",
  createdAt, updatedAt
}

### ۱۴. StockMovement (ورود/خروج انبار)

{
  id: "uuid",
  itemId: "uuid",
  type: "in" | "out" | "adjustment",
  quantity: 100,
  unitPrice: 12000,
  totalPrice: 1200000,
  reason: "purchase" | "consumption" | "sale" | "loss" | "adjustment",
  referenceId: "uuid|null",  // FK به فاکتور، ثبت روزانه، ...
  date: "ISO",
  notes: "",
  createdAt
}

### ۱۵. Customer (مشتری)

{
  id: "uuid",
  name: "آقای رضایی",
  phone: "",
  address: "",
  type: "wholesale" | "retail" | "restaurant" | "shop" | "other",
  balance: 2450000,  // مانده (مثبت = طلب)
  trustScore: 5,     // 1-10
  notes: "",
  createdAt, updatedAt,
  isDeleted: false
}

### ۱۶. Invoice (فاکتور فروش)

{
  id: "uuid",
  number: "۱۴۰۵-۰۰۱",
  customerId: "uuid",
  date: "ISO",
  items: [{
    description: "تخم خوراکی",
    unit: "شانه",
    quantity: 100,
    unitPrice: 250000,
    total: 25000000
  }],
  subtotal: 25000000,
  discount: 0,
  total: 25000000,
  paymentType: "cash" | "card" | "check" | "installment" | "mixed",
  payments: [{
    method: "cash",
    amount: 15000000,
    date: "ISO"
  }],
  dueDate: "ISO|null",
  status: "paid" | "partial" | "unpaid" | "overdue",
  notes: "",
  createdAt, updatedAt
}

### ۱۷. Settings (تنظیمات)

{
  id: "settings",
  theme: "light" | "dark",
  fontSize: "small" | "medium" | "large",
  language: "fa",
  farm: {
    name: "",
    address: "",
    phone: "",
    logo: ""
  },
  activeModules: ["dsh","brd","hal","flk","inc","dlg","whs","sal"],
  backup: {
    auto: true,
    interval: 24,  // ساعت
    maxCopies: 5
  },
  notifications: {
    inApp: true,
    sms: false,
    email: false,
    telegram: false
  },
  updatedAt: "ISO"
}

## روابط

Bird 1 ─── N Breed
Bird 1 ─── N Flock
Breed 1 ─── N Flock
Hall 1 ─── N Zone
Hall 1 ─── N Equipment
Hall 1 ─── N Flock
Device 1 ─── N EggEntry
HatchGroup 1 ─── N EggEntry
EggEntry 1 ─── N Candling
EggEntry 1 ─── 1 Hatch
Flock 1 ─── N DailyLog
WarehouseItem 1 ─── N StockMovement
Customer 1 ─── N Invoice

## UUID

نسخه ۴ — با crypto.randomUUID() یا uuid npm

## تاریخ

ISO 8601 در ذخیره، شمسی در نمایش
date-fns-jalali برای تبدیل

## اعتبارسنجی (Zod)

هر موجودیت یک schema دارد در src/mod/*/schemas.ts
Cross-field validation در schema سطح بالاتر

نمونه:
- Flock.endDate نباید قبل از startDate
- EggEntry.count نباید بیشتر از Device.capacity
- Candling.alive + infertile + dead + broken = EggEntry.count
- Invoice.paid ≤ Invoice.total
SCHEMA_EOF

# ============================================================
# فایل ۳: WORKFLOW.md
# ============================================================
echo "📝 نوشتن WORKFLOW.md..."
cat > doc/WORKFLOW.md << 'WORKFLOW_EOF'
# WORKFLOW.md — قوانین کار

نسخه: ۱.۰
وضعیت: قفل‌شده

## ۱. قوانین طلایی با AI

۱. قبل از هر تغییر، توضیح بده
۲. فقط یک فایل در هر مرحله
۳. کد را تکه‌تکه بده (نه کامل)
۴. اگر تغییر در ۳+ فایل شد، توقف کن
۵. اگر لازم شد، Snapshot بگیر
۶. هرگز فایل کامل را بازنویسی نکن
۷. پیش‌نمایش HTML قبل از React

## ۲. روش کاربر

- کاربر کدنویس نیست
- فقط کپی/پیست می‌کند
- با nano کار می‌کند
- روی گوشی Termux
- اسکرین‌شات: فقط ضروری
- فایل: فقط مشکل‌دار

## ۳. گردش کار

۱. کاربر وضعیت را می‌گوید
۲. AI توضیح می‌دهد (بدون کد)
۳. کاربر تأیید می‌کند
۴. AI کد تکه‌ای می‌دهد
۵. کاربر پیست + ذخیره
۶. کاربر تست می‌کند
۷. اگر اوکی، PROJECT-LOG به‌روز می‌شود

## ۴. اصل تأیید قبل از تغییر

مرحله ۱: توضیح (به زبان ساده)
مرحله ۲: پیش‌نمایش (HTML مستقل)
مرحله ۳: انتظار برای تأیید
مرحله ۴: اعمال تغییر
مرحله ۵: گزارش نهایی

قانون آهنین:
«هیچ تغییری بدون تأیید کاربر اعمال نمی‌شود.»
«هیچ کدی بدون پیش‌نمایش نوشته نمی‌شود.»

## ۵. Snapshot

قبل از تغییر بزرگ:
cp -r src src-backup-$(date +%Y%m%d-%H%M)

اگر خراب شد:
rm -rf src && mv src-backup-xxx src

## ۶. مدیریت چت

- هر چت: یک کار
- چت جدید: کار جدید
- اول PROJECT-LOG پیست شود
- بعد درخواست

## ۷. مدیریت توکن

- اسکرین‌شات: فقط ضروری
- فایل: فقط مشکل‌دار
- چت: کوتاه و متمرکز
- سؤال: دقیق، نه کلی
- اول توضیح، بعد کد

## ۸. مراحل ساخت هر ماژول

۱. صحبت درباره نیازمندی‌ها
۲. طراحی پیش‌نمایش HTML
۳. کاربر بررسی و تأیید
۴. اصلاحات (اگر لازم)
۵. تبدیل به React
۶. تست در مرورگر
۷. اتصال به ماژول‌های دیگر
۸. ادامه به ماژول بعدی

## ۹. محیط کاری

گوشی: Termux
ویرایش: nano
پورت: 3000
مرورگر: localhost:3000
تست: در مرورگر خود گوشی

## ۱۰. فرآیند انتقال کد

AI کد را می‌دهد
کاربر کپی می‌کند
در nano پیست می‌کند
ذخیره (Ctrl+O, Enter, Ctrl+X)
Vite خودکار refresh
کاربر تست می‌کند

## ۱۱. تصمیمات فنی قفل‌شده

- TypeScript strict: بله
- Form: React Hook Form + Zod
- ID: UUID v4
- Backup: نسخه‌دار (version + schema)
- MVP: ۸ ماژول اصلی

## ۱۲. ماژول‌های MVP

set — تنظیمات
brd — پرنده‌ها و نژادها
hal — سالن‌ها
flk — گله‌ها
inc — جوجه‌کشی
dlg — ثبت روزانه
whs — انبار
sal — فروش

## ۱۳. ماژول‌های فاز ۲

egg, fed, med, tmd, dea, cus, wrk, rep, alt, arc

## ۱۴. تفکیک وظایف

AI:
- توضیح تصمیم
- پیش‌نمایش HTML
- تولید کد React
- حل مشکل فنی
- مستندسازی

کاربر:
- تست بصری
- تصمیم نهایی
- کپی/پیست
- ذخیره فایل
- گزارش نتیجه
WORKFLOW_EOF

# ============================================================
# فایل ۴: PROJECT-LOG.md
# ============================================================
echo "📝 نوشتن PROJECT-LOG.md..."
cat > doc/PROJECT-LOG.md << 'LOG_EOF'
# PROJECT-LOG.md — حافظه پروژه

آخرین به‌روزرسانی: ۱۴۰۵/۰۷/۰۴

## وضعیت فعلی

- نسخه: ۰.۱.۰
- فاز: راه‌اندازی
- مرحله: ساخت اسناد قانون اساسی

## فاز کامل‌شده

- ✅ طراحی سیستم کامل (v10)
- ✅ قواعد فرم و انیمیشن
- ✅ حذف پرش انیمیشن‌ها
- ✅ DESIGN.md نوشته شد
- ✅ SCHEMA.md نوشته شد
- ✅ WORKFLOW.md نوشته شد

## تصمیمات قفل‌شده

- TypeScript strict: بله
- Form: React Hook Form + Zod
- State: Zustand + persist
- ID: UUID v4
- Backup: نسخه‌دار
- MVP: ۸ ماژول
- تم: ۲ تم (light/dark)
- انیمیشن: بدون translateY کمتر از ۴px
- فیلد وابسته: grid-template-rows
- دو ستونه: minmax(0, 1fr)

## ساختار پوشه

poultry-manager/
├── doc/ (مستندات)
├── public/ (فایل‌های استاتیک)
├── src/
│   ├── cor/ (هسته)
│   ├── shr/ (مشترک)
│   └── mod/ (ماژول‌ها)
└── (پیکربندی‌ها)

## گام‌های بعدی

۱. ساخت اسکلت React
۲. توکن‌های CSS
۳. کامپوننت‌های پایه
۴. ماژول set

## فایل‌های مهم

- doc/DESIGN.md — مرجع طراحی
- doc/SCHEMA.md — ساختار داده
- doc/WORKFLOW.md — قوانین کار
- doc/PROJECT-LOG.md — این فایل

## نکات برای AI بعدی

- قبل از تغییر، این فایل را بخوان
- قبل از کد، پیش‌نمایش HTML بده
- فایل‌های قانون اساسی را نخوانده، تغییر نده
- کاربر فارسی‌زبان است، بدون اصطلاح فنی
- محیط: Termux + nano + موبایل
LOG_EOF

echo ""
echo "✅ همه فایل‌ها ساخته شدند:"
echo "   - doc/DESIGN.md"
echo "   - doc/SCHEMA.md"
echo "   - doc/WORKFLOW.md"
echo "   - doc/PROJECT-LOG.md"
echo ""
echo "📊 آمار:"
ls -la doc/
echo ""
echo "🎯 گام بعدی: ساخت اسکلت React"0x
0




etup.sh0x0x0x0x0x

etup.sh0x0x0x0x0x0



etup.sh0x0x0x0x0x0o0

