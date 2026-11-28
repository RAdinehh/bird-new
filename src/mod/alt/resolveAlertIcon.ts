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
  if (alert.source === "whs" && alert.sourceId) {
    const recordId = alert.sourceId.split(":")[0];
    const item = useWhs.getState().items.find((i) => i.id === recordId);
    if (item?.icon && item.icon.trim()) {
      return item.icon.trim();
    }
  }

  return resolveAlertIconKey(alert);
}
