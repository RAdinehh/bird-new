# DELETION-RULES

> قانون: تاریخچه را پاک نکن.

## Master Data
- Item, Flock, Hall, Breed
- الگو: Archive + Delete only if no refs

## Transaction
- Invoice, Deal
- الگو: RecycleBin (۳۰ روز)

## Anti-Pattern
movements.filter(x => x.itemId !== id) در delete ممنوع
