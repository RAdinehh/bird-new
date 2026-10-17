/**
 * GroupComparisonModal.tsx — مقایسه ۲-۳ گروه
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Select } from '../../../shr/components/ui';
import { useFlk, type FlockGroupType } from '../store';
import { useMultiGroupKpi } from '../hooks/useGroupKpi';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<FlockGroupType, string> = {
  season: '🗓', breed: '🧬', cohort: '👥', farm: '🏭', owner: '👤', custom: '📁', smart: '🤖',
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return toFa((n / 1_000_000).toFixed(1)) + 'M';
  if (Math.abs(n) >= 1_000) return toFa(Math.round(n / 1_000)) + 'K';
  return toFa(Math.round(n));
}

interface KpiRow {
  label: string;
  values: { display: string; raw: number; better?: 'low' | 'high' }[];
}

export default function GroupComparisonModal({ open, onClose }: Props) {
  const groups = useFlk(s => s.groups);
  const [ids, setIds] = useState<string[]>([]);

  const availableGroups = groups.filter(g => !g.archived);

  // KPIs for all groups (single hook call — hooks-safe)
  const allKpis = useMultiGroupKpi(ids);
  const kpis = ids.map(id => {
    const g = groups.find(x => x.id === id);
    const kpi = allKpis[id];
    return { group: g, kpi };
  }).filter(x => x.group && x.kpi);

  const rows: KpiRow[] = [
    {
      label: 'گله',
      values: kpis.map(({ kpi }) => ({ display: toFa(kpi.flockCount), raw: kpi.flockCount })),
    },
    {
      label: 'پرنده فعلی',
      values: kpis.map(({ kpi }) => ({ display: toFa(kpi.totalCurrent), raw: kpi.totalCurrent })),
    },
    {
      label: 'تلفات',
      values: kpis.map(({ kpi }) => ({
        display: toFa(kpi.totalDeaths) + ' (' + toFa(kpi.mortalityRate.toFixed(1)) + '٪)',
        raw: kpi.mortalityRate,
        better: 'low',
      })),
    },
    {
      label: 'هزینه',
      values: kpis.map(({ kpi }) => ({ display: fmtMoney(kpi.totalCost), raw: kpi.totalCost })),
    },
    {
      label: 'فروش',
      values: kpis.map(({ kpi }) => ({ display: fmtMoney(kpi.totalRevenue), raw: kpi.totalRevenue, better: 'high' })),
    },
    {
      label: 'سود',
      values: kpis.map(({ kpi }) => ({ display: fmtMoney(kpi.totalProfit), raw: kpi.totalProfit, better: 'high' })),
    },
  ];

  const addGroup = (id: string) => {
    if (!id || ids.includes(id) || ids.length >= 3) return;
    setIds([...ids, id]);
  };

  const removeGroup = (id: string) => {
    setIds(ids.filter(x => x !== id));
  };

  return (
    <Modal open={open} onClose={onClose} title="🔍 مقایسه گروه‌ها">
      {/* انتخاب گروه‌ها */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {ids.map(id => {
          const g = groups.find(x => x.id === id);
          if (!g) return null;
          return (
            <span
              key={id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                borderRadius: 'var(--r-sm)',
                fontSize: 12, fontWeight: 700, color: 'var(--accent)',
              }}
            >
              {TYPE_ICON[g.type]} {g.name}
              <button
                type="button"
                onClick={() => removeGroup(id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
              >✕</button>
            </span>
          );
        })}
        {ids.length < 3 && (
          <Select value="" onChange={e => addGroup(e.target.value)} style={{ minWidth: 160, height: 32 }}>
            <option value="">+ افزودن گروه...</option>
            {availableGroups.filter(g => !ids.includes(g.id)).map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        )}
      </div>

      {ids.length < 2 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
          <div>حداقل ۲ گروه انتخاب کن</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={{ textAlign: 'right', padding: 6, color: 'var(--muted)', fontWeight: 600 }}>KPI</th>
                {kpis.map(({ group }) => (
                  <th key={group!.id} style={{ textAlign: 'center', padding: 6, color: 'var(--accent)', fontWeight: 700 }}>
                    {TYPE_ICON[group!.type]} {group!.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                // پیدا کردن برنده برای این row
                let bestIdx = -1;
                if (row.values[0].better) {
                  const vals = row.values.map(v => v.raw);
                  const target = row.values[0].better === 'high' ? Math.max(...vals) : Math.min(...vals);
                  bestIdx = vals.indexOf(target);
                }
                return (
                  <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 6, fontWeight: 600, color: 'var(--muted)' }}>{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} style={{
                        padding: 6, textAlign: 'center',
                        fontWeight: i === bestIdx ? 700 : 500,
                        color: i === bestIdx ? 'var(--accent)' : 'var(--text)',
                        background: i === bestIdx ? 'var(--accent-soft)' : 'transparent',
                      }}>
                        {v.display} {i === bestIdx && '🏆'}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}
