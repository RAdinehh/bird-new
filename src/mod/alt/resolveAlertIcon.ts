import { useWhs, type ItemCategory } from "../whs/store";
import { getSmartFeedIcon } from "../../shr/icons/AppIcons";
import { resolveAlertIconKey, resolveCategoryIconKey } from "../../shr/components/uiIconRegistry";

const WHS_CATEGORY_ICON: Record<ItemCategory, string> = {
  feed: "feed",
  medicine: "meds",
  vaccine: "meds",
  herbal: "herbal",
  equipment: "equipment",
  consumable: "pack",
  egg: "egg",
  manure: "manure",
  broken: "broken",
};

export function resolveAlertIcon(alert: {
  source?: string;
  sourceId?: string;
  title?: string;
  message?: string;
  category?: string;
  level?: string;
}): string {
  // 1. اولویت اول: خود قلم در ماژول مبدأ (آیکون ثبت‌شده ← تشخیص از نام ← زیردسته‌ی قلم در انبار)
  if (alert.source === "whs" && alert.sourceId) {
    const recordId = alert.sourceId.split(":")[0];
    const item = useWhs.getState().items.find((i) => i.id === recordId);
    if (item?.icon && item.icon.trim()) {
      return item.icon.trim();
    }
    if (item?.name) {
      const fromItemName = getSmartFeedIcon(item.name, "unknown");
      if (fromItemName !== "unknown") return fromItemName;
    }
    if (item?.category && WHS_CATEGORY_ICON[item.category]) {
      return WHS_CATEGORY_ICON[item.category];
    }
  }

  // 2. اولویت دوم: کلیدواژه‌های مشترک بین ماژول‌ها
  const t = (alert.title || "").trim();
  if (/یادآور/.test(t)) return "reminder";
  if (/قول پرداخت|تعویق|چک/.test(t)) return "payment_promise";
  if (/طلب|بدهی/.test(t)) return "cash";
  if (/نزدیک انقضا/.test(t)) return "expiring_soon";
  if (/انقضا|منقضی/.test(t)) return "expired";
  if (/تجهیز|سرویس|گارانتی/.test(t)) return "equipment";
  if (/پرهیز|واکسن/.test(t)) return "meds";
  if (/هچ|جوجه‌کشی|Lock-down|چرخش/.test(t)) return "hatch";
  if (/تخم/.test(t)) return "egg";
  if (/تلفات/.test(t)) return "mortality";
  if (/دما|EST/.test(t)) return "climate";
  if (/رطوبت/.test(t)) return "humidity";
  if (/تهویه|CO₂|O₂/.test(t)) return "ventilation";
  if (/بستر/.test(t)) return "litter";
  if (/بی‌حال|سرفه|عطسه|گوشه‌گیر/.test(t)) return "behavior";
  if (/چرخه|گله مادر/.test(t)) return "flock";

  // 3 و 4. اولویت سوم و چهارم: نام خوراک در متن ← دسته‌بندی/ماژول هشدار
  const resolved = resolveAlertIconKey(alert);
  if (resolved && resolved !== "unknown") return resolved;

  // 5. اولویت پنجم: سطح هشدار ← و در نهایت unknown
  return resolveCategoryIconKey("alert", alert.level);
}
