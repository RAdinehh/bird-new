export function getFeedSourceIcon(name: string, kind: "formula" | "item" = "item"): string {
  if (kind === "formula") return "feed";
  const n = (name || "").trim();
  if (/روغن/i.test(n)) return "oil";
  if (/ذرت/i.test(n)) return "corn";
  if (/سویا|کنجاله سویا/i.test(n)) return "soybean_meal";
  if (/گندم/i.test(n)) return "wheat";
  if (/جو/i.test(n)) return "barley";
  if (/سبوس/i.test(n)) return "bran";
  if (/یونجه/i.test(n)) return "alfalfa";
  if (/کلزا|کانولا/i.test(n)) return "canola_meal";
  if (/آفتابگردان/i.test(n)) return "sunflower_meal";
  if (/کنجد/i.test(n)) return "sesame_meal";
  if (/ماهی|پودر ماهی/i.test(n)) return "fish_meal";
  if (/صدف/i.test(n)) return "oyster_shell";
  if (/کلسیم|دی‌کلسیم|کربنات/i.test(n)) return "calcium_powder";
  if (/نمک/i.test(n)) return "salt";
  if (/مکمل|پرمیکس|ویتامین/i.test(n)) return "premix";
  if (/متیونین|لیزین|آمینو/i.test(n)) return "amino_acid";
  return "feed";
}
