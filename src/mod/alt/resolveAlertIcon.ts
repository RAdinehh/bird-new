import { useWhs } from "../whs/store";
import { resolveAlertIconKey } from "../../shr/components/uiIconRegistry";

export function resolveAlertIcon(alert: {
  source?: string;
  sourceId?: string;
  title?: string;
  message?: string;
  category?: string;
  level?: string;
}): string {
  // 1. اولویت اول: آیکون واقعی خود قلم در انبار (ماژول مبدأ)
  if (alert.source === "whs" && alert.sourceId) {
    const recordId = alert.sourceId.split(":")[0];
    const item = useWhs.getState().items.find((i) => i.id === recordId);
    if (item?.icon && item.icon.trim()) {
      return item.icon.trim();
    }
  }

  // 2. اولویت دوم: تشخیص کلمات کلیدی مشترک و پرتکرار در عنوان هشدار
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

  // 3. اولویت سوم: تشخیص هوشمند نام خوراک (گندم، جو، ذرت، کنجد...) و در نهایت زیرگروه
  return resolveAlertIconKey(alert);
}
