# SCHEMA.md — ساختار داده

نسخه ۱.۰

## قوانین
- هر رکورد: id (UUID), createdAt, updatedAt
- حذف نرم: isDeleted
- backup نسخه‌دار

## ساختار پشتیبان
{
  version: 1,
  schemaVersion: 1,
  exportedAt: "ISO",
  data: {...}
}

## موجودیت‌ها

### Bird پرنده
id, name, nameEn, icon, cycleDays, fcrStandard, notes

### Breed نژاد
id, birdId, name, fcr, notes

### Hall سالن
id, name, code, length, width, height, capacity,
targetTemp, targetHumidity, ventilation, light,
address, builtAt, lastSanitizedAt

### Zone بخش
id, hallId, name, capacity

### Equipment تجهیزات
id, hallId, type, name, count, price, purchasedAt

### Flock گله
id, name, birdId, breedId, hallId, zoneId,
count, startDate, endDate,
type: layer|broiler|breeder,
status: active|archived|sold,
maleCount, femaleCount

### Device دستگاه
id, name, capacity,
mode: setter|hatcher|setter+hatcher,
status: active|idle|broken|maintenance,
temp, humidity, rotationEnabled

### HatchGroup گروه هچ
id, name, targetHatchDate, status

### EggEntry ورودی تخم
id, deviceId, hatchGroupId, birdId, breedId,
count, entryDate, source,
dealType: personal|partnership|rent|consignment,
dealData {partnerName, percent, rentAmount, ...},
trayNumbers[]

### Candling کندلینگ
id, eggEntryId, stage: 1|2|3,
alive, infertile, dead, broken, reasons

### Hatch هچ
id, eggEntryId, hatched, unhatched, reasons

### DailyLog ثبت روزانه
id, flockId, hallId, date,
temp, humidity, ventilation, light, litter,
deaths, feedAmount, waterAmount,
vaccines[], medications[], notes, photos[]

### WarehouseItem انبار
id, name, category, unit, currentStock,
minStock, maxStock, lastPrice, expireAt

### StockMovement گردش
id, itemId, type: in|out, quantity,
unitPrice, reason, referenceId, date

### Customer مشتری
id, name, phone, address,
type: wholesale|retail|restaurant|shop,
balance, trustScore

### Invoice فاکتور
id, number, customerId, date, items[],
subtotal, discount, total, paymentType,
payments[], dueDate, status

### Settings تنظیمات
theme, fontSize, farm{}, activeModules[],
backup{}, notifications{}

## روابط
Bird→Breed, Bird→Flock, Breed→Flock
Hall→Zone, Hall→Equipment, Hall→Flock
Device→EggEntry, HatchGroup→EggEntry
EggEntry→Candling, EggEntry→Hatch
Flock→DailyLog
WarehouseItem→StockMovement
Customer→Invoice

## اعتبارسنجی
- Flock.endDate ≥ startDate
- EggEntry.count ≤ Device.capacity
- Candling.alive+infertile+dead+broken = EggEntry.count
