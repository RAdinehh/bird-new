import { resolveCategoryIconKey } from '../../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../../shr/components/OptionIcon';
/**
 * GroupComparisonModal.tsx — مقایسه ۲-۳ گروه
 */
import { useFormat, getGlobalFormat } from '../../../shr/units/useFormat';

import { useState } from 'react';
import { Modal, Btn, BtnRow, Select } from '../../../shr/components/ui';
import { useFlk, type FlockGroupType } from '../store';
import { useMultiGroupKpi } from '../hooks/useGroupKpi';
import { toFa } from '../../../shr/utils/fa';
import SmartSelect from '../../../shr/components/SmartSelect';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPE_ICON: Record<FlockGroupType, string> = {
  season: '🗓', breed: '🧬', cohort: '👥', farm: '🏭', owner: '👤', custom: '📁', smart: '🤖',
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return getGlobalFormat().num(n / 1_000_000) + 'M';
  if (Math.abs(n) >= 1_000) return getGlobalFormat().count(Math.round(n / 1_000)) + 'K';
  return getGlobalFormat().count(Math.round(n));
}

interface KpiRow {
  label: string;
  values: { display: string; raw: number; better?: 'low' | 'high' }[];
}

export default function GroupComparisonModal({ open, onClose }: Props) {
  const fmt = useFormat();
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
      values: kpis.map(({ kpi }) => ({ display: fmt.count(kpi.flockCount), raw: kpi.flockCount })),
    },
    {
      label: 'پرنده فعلی',
      values: kpis.map(({ kpi }) => ({ display: fmt.count(kpi.totalCurrent), raw: kpi.totalCurrent })),
    },
    {
      label: 'تلفات',
      values: kpis.map(({ kpi }) => ({
        display: fmt.count(kpi.totalDeaths) + ' (' + fmt.num(kpi.mortalityRate) + '٪)',
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
    <Modal open={open} onClose={onClose} title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon="compare_scale" size={18} /><span>مقایسه گروه‌ها</span></span>}>
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
          <SmartSelect
            value=""
            placeholder="+ افزودن گروه..."
            modalTitle="انتخاب گروه برای مقایسه"
            options={availableGroups
              .filter((g) => !ids.includes(g.id))
              .map((g) => ({ value: String(g.id), label: String(g.name) }))}
            onChange={(val: string) => {
              if (val) addGroup(val);
            }}
          />
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
