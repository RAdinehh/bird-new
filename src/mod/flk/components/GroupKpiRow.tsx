/**
 * GroupKpiRow.tsx — کارت KPI گروه گله
 * جدا شده از GroupsPage.tsx
 */
import type { FlockGroup } from '../store';
import { useGroupKpi } from '../hooks/useGroupKpi';
import { toFa } from '../../../shr/utils/fa';

export interface GroupKpiRowProps {
  group: FlockGroup;
  onOpen: () => void;
}

export function GroupKpiRow({ group, onOpen }: GroupKpiRowProps) {
  const kpi = useGroupKpi(group.id);
  if (kpi.flockCount === 0) return null;

  const profitTone = kpi.totalProfit > 0 ? 'var(--accent)' : kpi.totalProfit < 0 ? 'var(--danger)' : 'var(--muted)';
  const mortalityTone = kpi.mortalityRate > 5 ? 'var(--danger)' : kpi.mortalityRate > 3 ? 'var(--warn)' : 'var(--accent)';

  return (
    <div
      onClick={onOpen}
      style={{
        marginTop: 8,
        paddingTop: 8,
        borderTop: '1px dashed var(--border)',
        display: 'flex',
        gap: 14,
        flexWrap: 'wrap',
        fontSize: 11,
        color: 'var(--muted)',
        alignItems: 'center',
        cursor: 'pointer',
      }}
      title="کلیک برای گزارش کامل"
    >
      <span>🐔 <b style={{ color: 'var(--text)' }}>{toFa(kpi.totalCurrent)}</b></span>
      {kpi.totalDeaths > 0 && (
        <span>💀 <b style={{ color: mortalityTone }}>{toFa(kpi.totalDeaths)}</b> ({toFa(kpi.mortalityRate.toFixed(1))}٪)</span>
      )}
      {kpi.totalCost > 0 && <span>💰 <b style={{ color: 'var(--text)' }}>{toFa(Math.round(kpi.totalCost / 1_000_000))}M</b></span>}
      {kpi.totalRevenue > 0 && <span>📈 <b style={{ color: profitTone }}>{toFa(Math.round(kpi.totalProfit / 1_000_000))}M</b></span>}
    </div>
  );
}
