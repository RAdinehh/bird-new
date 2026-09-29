# SCHEMA.md — ساختار داده

نسخه: 2.0 | تاریخ: ۱۴۰۵/۰۷/۰۷ | Commit: b687201

قوانین کلی:
- هر رکورد: id (UUID v4)، createdAt، updatedAt
- حذف نرم: isDeleted
- Backup نسخه‌دار

## موجودیت‌ها

Bird — پرنده
id, name, nameEn, icon, cycleDays, fcrStandard, notes

Breed — نژاد
id, birdId, name, fcr, notes

Hall — سالن
id, name, code, length, width, height, capacity, targetTemp, targetHumidity, ventilation, light, address, builtAt, lastSanitizedAt

Zone — بخش
id, hallId, name, capacity

Equipment — تجهیزات
id, hallId, type, name, count, price, purchasedAt

Flock — گله
id, name, birdId, breedId, hallId, zoneId, count, startDate, endDate, type, status, maleCount, femaleCount
type: layer | broiler | breeder
status: active | archived | sold

Device — دستگاه جوجه‌کشی
id, name, capacity, mode, status, temp, humidity, rotationEnabled
mode: setter | hatcher | setter+hatcher
status: active | idle | broken | maintenance

HatchGroup — گروه هچ
id, name, targetHatchDate, status

EggEntry — ورودی تخم
id, deviceId, hatchGroupId, birdId, breedId, count, entryDate, source, dealType, dealData, trayNumbers
dealType: personal | partnership | rent | consignment

Candling — کندلینگ
id, eggEntryId, stage, alive, infertile, dead, broken, reasons
stage: 1 | 2 | 3

Hatch — هچ
id, eggEntryId, hatched, unhatched, reasons

DailyLog — ثبت روزانه
id, flockId, hallId, date, temp, humidity, ventilation, light, litter, deaths, feedAmount, waterAmount, vaccines, medications, notes, photos

Contact — مخاطبین (جدید)
id, name, type, phone, mobile, address, notes, balance, trustScore
type: customer | supplier | worker | all

WarehouseItem — کالای انبار
id, name, category, unit, minStock, maxStock, expireAt, itemDetails
نکته: currentStock/lastPrice حذف شدند → از Movement محاسبه می‌شوند

itemDetails (ItemCategoryFields):
- عمومی: shipping, itemPartyId, priceUnit, sourceType, isPreorder, deliveryDate
- دارو: medicineType, herbalDetails, chemicalDetails, vaccineDetails
- پرنده: birdId, breedId, flockId, ageDays, maleCount, femaleCount, unknownCount, liveWeight
- تخم: eggTypes, saleReason
- تجهیزات: model, warrantyMonths

StockMovement — گردش انبار
id, itemId, type, quantity, unitPrice, reason, referenceId, date
type: in | out

Invoice — فاکتور (بازنویسی v0.7.0):
پایه: id, number, partyId, date, type, items, notes
مالی: subtotal, itemDiscountTotal, shippingTotal, discountTotal, total
پرداخت (A): paymentTerms, installmentCount, installmentGapDays, customDueDate, dueDate
Workflow (B): workflowStatus, confirmedAt, receivedAt, receivedNote, paidAt, paidNote
پیش‌فروش (C): isPreorder, deliveryDate, advancePayment, advancePercent
تعویق (D): deferrals, remindersMuted
type: sale | purchase
paymentTerms: cash | installment | custom
workflowStatus: draft | confirmed | received | paid
شماره: P140507001 (خرید) / S140507001 (فروش)

InvoiceItem — اقلام فاکتور:
پایه: id, itemId, name, quantity, unit, unitPrice, total
تخفیف (E): discountType, discountValue, discountAmount
جزئیات: shipping, itemPartyId, ...itemDetails

Payment — پرداخت
id, invoiceId, amount, date, method, referenceId, note, status, clearedDate, bouncedDate
method: cash | card | cheque | transfer
status: pending | cleared | bounced

Settings — تنظیمات
theme, fontSize, farm, activeModules, backup, notifications

## روابط
Bird → Breed → Flock → DailyLog
Hall → Zone → Flock
Hall → Equipment
Device → EggEntry → Candling/Hatch
HatchGroup → EggEntry
WarehouseItem → StockMovement
Contact → Invoice → Payment

## اعتبارسنجی
- Flock.endDate ≥ startDate
- EggEntry.count ≤ Device.capacity
- Candling.alive + infertile + dead + broken = EggEntry.count
- Payment.amount > 0
- Invoice.total = subtotal − discountTotal + shippingTotal

پایان · v2.0 · ۱۴۰۵/۰۷/۰۷
