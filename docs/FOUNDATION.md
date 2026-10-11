# 🏛 FOUNDATION.md — پایه‌ی معماری Bird-new

> این سند مرجع توکن‌ها، قراردادها و قوانین آهنین است.
> آخرین به‌روزرسانی: ۱۴۰۴/۰۷/۲۰

---

## بخش ۱ — قرارداد توکن‌ها

منبع: `src/shr/styles/global.css` (۵۴۰ خط، کاملاً مجهز)

### ۱.۱ رنگ‌ها

| کاربرد | توکن | نکته |
|---|---|---|
| پس‌زمینه اصلی | `--bg` | بدنه صفحه |
| پس‌زمینه کارت | `--btn-bg` | کارت روی bg |
| پس‌زمینه ورودی | `--input-bg` | input ها |
| پس‌زمینه هدر | `--header-bg` | هدر شفاف |
| مرز | `--border` / `--border-solid` | شفاف / توپر |
| متن اصلی | `--text` | تیتر، پاراگراف |
| متن کم‌رنگ | `--muted` | توضیح ثانویه |
| تاکید | `--accent` | دکمه اصلی، لینک |
| تاکید soft | `--accent-soft` | پس‌زمینه رنگی ملایم |
| تاکید border | `--accent-border` | مرز رنگی |
| هشدار | `--warn` + `--warn-soft` | زرد/نارنجی |
| خطر | `--danger` + `--danger-soft` | خطا، حذف |
| اطلاعات | `--info` + `--info-soft` | آبی، راهنما |
| ویژه | `--purple` + `--purple-soft` | بج، تگ |
| متن روی دکمه | `--avatar-text` | جایگزین `#fff` |
| پوشش مودال | `--overlay` | پس‌زمینه دیالوگ |
| دسته‌بندی | `--cat-*-soft` | ۱۴ توکن تجهیزات |

**استثناهای مجاز (hex مجاز):**
- `src/cor/theme/applyTheme.ts`
- `src/cor/events/DebugPanel.tsx`
- `src/shr/utils/export.ts`
- هر `InvoicePrint.tsx`

**قانون:** هیچ `#hex` توی JSX. همیشه `var(--*)`.

### ۱.۲ فاصله‌ها

| توکن | مقدار | کاربرد |
|---|---|---|
| `--sp-1` | ~4px | خیلی کم |
| `--sp-2` | ~8px | کم |
| `--sp-3` | ~12px | متوسط |
| `--sp-4` | ~14-16px | راحت |
| `--sp-5` | ~16-20px | بزرگ |
| `--sp-6` | ~20-24px | خیلی بزرگ |
| `--sp-7` | ~24px | بزرگ‌تر |
| `--sp-8` | ~32px | خیلی زیاد |

ترکیب‌های آماده: `--pad-tight`، `--pad-normal`، `--pad-comfy`، `--pad-loose`، `--gap-xs/sm/md/lg`

**قانون:** هیچ `padding: 16` هاردکد. → `padding: var(--sp-5)`.
**نکته:** media query مقدار `--sp-unit` رو ریسپانسیو می‌کنه.

### ۱.۳ Radius

| توکن | مقدار | کاربرد |
|---|---|---|
| `--r-sm` | 6-8px | chip، تگ کوچیک |
| `--r-md` | 8-10px | دکمه، input |
| `--r-lg` | 12px | کارت |
| `--r-xl` | 16px | sheet، مودال |
| `--r-2xl` | 20px | کارت بزرگ |

### ۱.۴ فونت

- اندازه: `--fs-xs/sm/md/lg/xl`
- وزن: ۴۰۰ (معمولی) / ۶۰۰ (تاکید) / ۷۰۰ (تیتر)
- **ممنوع:** `fontSize: 13` هاردکد — همیشه توکن

---

## بخش ۲ — Contracts (قرارداد بین لایه‌ها)

### ۲.۱ Store Contract

هر Zustand store **باید** با این ساختار تعریف شه:

    export const useXxx = create<State>()(
      persist(
        (set, get) => ({ /* actions */ }),
        { name: 'pm-xxx' }
      )
    );

**قوانین:**
- `name:` اجباری — بدون اون persist کار نمی‌کنه
- اگه schema تغییر کرد → `merge` هم به‌روز شه
- Store های aggregate (مثل `cal`, `dsh`) نباید persist داشته باشن
- ذخیره‌سازی بزرگ (مثل `doc`) → IndexedDB، نه persist

**۱۳ store فعال:**
`pm-settings`, `pm-brd`, `pm-hal`, `pm-ctc`, `pm-flk`, `pm-inc`, `pm-egg`, `pm-dlg`, `pm-whs`, `pm-fed`, `pm-tra`, `pm-alt`, `pm-cal-manual`

### ۲.۲ Module Contract

هر ماژول در `src/mod/xxx/`:

| فایل | اجباری؟ | نقش |
|---|---|---|
| `index.tsx` | فقط اگه ۲+ تب | tab wrapper |
| `store.ts` | فقط اگه داده مستقل داره | Zustand |
| `XxxPage.tsx` | برای هر تب | صفحه |
| `_source.ts` | اگه auto/manual داره | تشخیص منبع |
| `presets.ts` | اگه داده پیش‌فرض داره | مقادیر اولیه |

**مثال چند-تب:** `brd/` (BirdsPage + BreedsPage)
**مثال تک‌صفحه:** `dsh/` (فقط Dashboard.tsx، بدون index.tsx)


### ۲.۳ Filter Contract

هر ماژول فیلترش توی `src/shr/filter/configs/xxx.tsx`:

    export function getXxxConfig(ctx: { ... }): FilterConfig<Entity> {
      return {
        filterDefs: [{ key, label, kind, icon, options, getValue }],
        sortDefs:   [{ key, label, icon, hint, compare }],
      };
    }

**قوانین:**
- همه config ها توی `shr/filter/configs/`
- تایپ‌ها توی `_types.ts` همون پوشه
- همیشه از `FilterBar` استفاده کن، نه فیلتر دستی

### ۲.۴ Validation Contract

- هر ماژول → یه فایل توی `src/shr/validation/rules/xxx.ts`
- خروجی: Zod schemas
- `validation/index.ts` همه رو re-export می‌کنه
- فرم‌ها باید از schema استفاده کنن، نه validation دستی

### ۲.۵ EntityLink Contract

لینک بین ماژول‌ها فقط با `EntityLink`:

    <EntityLink type="flock" id={id} label="گله ۱" />

**انواع مجاز:** flock، bird، breed، hall، party، invoice، item، device، log
**اضافه کردن نوع جدید:** فقط با تأیید کاربر + آپدیت MAP در `EntityLink.tsx`

---

## بخش ۳ — قوانین آهنین

### ۳.۱ کار با کاربر
1. کاربر کدنویس نیست — اسکریپت آماده بده، توضیح فنی نه
2. یه تغییر در هر مرحله — چند کار با هم ممنوع
3. بعد از هر تغییر: `python3 ~/auto_fast.py "پیام"`
4. قبل از تغییر بزرگ تأیید بگیر (shr، layout، store، props)

### ۳.۲ کامپوننت‌های قفل‌شده 🔒

بدون اجازه صریح دست نزن:
- `SelectSheetShell.tsx`, `SmartSelect.tsx`, `EditableSelect.tsx`
- `AutocompleteSheet.tsx`, `DependentSelect.tsx`
- `ui/Field.tsx`, `ui/Input.tsx`
- `EntityLink.tsx`, `OverrideHint.tsx`, `ExpandableCard.tsx`

**اگه کاربر گفت «خرابه»:** اول `git log --oneline -20 -- <file>` بزن، آخرین نسخه سالم رو `checkout` کن، commit کن. **fix نکن**.

### ۳.۳ قوانین کد
- فایل ≤ ۴۰۰ خط (بیشتر شد → refactor تدریجی)
- هیچ `#hex` توی JSX (توکن)
- هیچ `padding: N` هاردکد (توکن)
- هیچ hook بعد از `return` شرطی
- `useEffect` بدون dep کامل → ممنوع
- `any` فقط با comment توضیحی

### ۳.۴ قوانین Git
- `.bak`, `.save*` هرگز commit نشن
- پیام commit با `feat:` / `fix:` / `docs:` / `refactor:`
- قبل از تغییر بزرگ: `git tag before-xxx`
- `auto_fast.py` خودش tsc + build + commit + push + rollback داره

### ۳.۵ مستندات
- هر تغییر مهم → `docs/STATUS.md`
- false positive گزارش خودکار → علامت‌گذاری در `HANDOFF.md`
- استثنا معماری → `ARCHITECTURE.md` با دلیل و تاریخ

---

## بخش ۴ — منابع

| سند | نقش |
|---|---|
| `FOUNDATION.md` (این) | توکن + Contracts + قوانین |
| `HANDOFF.md` | وضعیت + مشکلات + برنامه |
| `ARCHITECTURE.md` | نقشه فایل‌ها + وابستگی |
| `AI-RULES.md` | قوانین کار با کاربر |
| `STANDARDS.md` | استانداردهای UI/UX |
| `AUDIT.md` | چک‌لیست ممیزی |
| `STATUS.md` | وضعیت زنده + نقشه راه |

---

*این سند پایه‌ی همه‌ی کارهای بعده. قبل از هر تغییر مرورش کن.*
