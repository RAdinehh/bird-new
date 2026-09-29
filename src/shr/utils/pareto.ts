// Pareto analysis — تحلیل ۸۰/۲۰
export interface ParetoItem {
  label: string;
  value: number;
  percent: number;
  cumulative: number;
  icon?: string;
}

export function pareto(entries: { label: string; value: number; icon?: string }[]): ParetoItem[] {
  const total = entries.reduce((a, x) => a + Math.abs(x.value || 0), 0);
  if (total === 0) return [];
  const sorted = [...entries].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  let cum = 0;
  return sorted.map(e => {
    const pct = (Math.abs(e.value) / total) * 100;
    cum += pct;
    return {
      label: e.label,
      value: e.value,
      percent: Math.round(pct * 10) / 10,
      cumulative: Math.round(cum * 10) / 10,
      icon: e.icon,
    };
  });
}
