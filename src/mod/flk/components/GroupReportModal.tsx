/**
 * GroupReportModal.tsx — گزارش جزئیات گروه گله
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useFlk, type FlockGroupType } from '../store';
import { useGroupKpi } from '../hooks/useGroupKpi';
import { toFa } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string | null;
}

const TYPE_ICON: Record<FlockGroupType, string> = {
  season: '🗓', breed: '🧬', cohort: '👥', farm: '🏭', owner: '👤', custom: '📁', smart: '🤖',
};

const TYPE_LABEL: Record<FlockGroupType, string> = {
  season: 'فصلی', breed: 'نژادی', cohort: 'هم‌دوره', farm: 'مزرعه', owner: 'مالک', custom: 'سفارشی', smart: 'هوشمند',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'فعال', archived: 'آرشیو', sold: 'فروخته‌شده', merged: 'ادغام‌شده',
};

function fmtMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) {
    return toFa((n / 1_000_000).toFixed(1)) + 'M';
  }
  if (Math.abs(n) >= 1_000) {
    return toFa(Math.round(n / 1_000)) + 'K';
  }
  return toFa(Math.round(n));
}

export default function GroupReportModal({ open, onClose, groupId }: Props) {
  const groups = useFlk(s => s.groups);
  const group = useMemo(() => groups.find(g => g.id === groupId), [groups, groupId]);
  const kpi = useGroupKpi(groupId || '');

  if (!open || !group) return null;

  const profitTone = kpi.totalProfit > 0 ? 'var(--accent)' : kpi.totalProfit < 0 ? 'var(--danger)' : 'var(--muted)';
  const mortalityTone = kpi.mortalityRate > 5 ? 'var(--danger)' : kpi.mortalityRate > 3 ? 'var(--warn)' : 'var(--accent)';

  const handleExportCSV = () => {
    try {
      const header = 'نام گله,وضعیت,تعداد اولیه,تعداد فعلی,سن (روز),هزینه,درآمد,سود\n';
      const rows = kpi.byFlock.map(f =>
        [f.name, STATUS_LABEL[f.status] || f.status, f.initialCount, f.currentCount, f.ageDays,
         Math.round(f.cost), Math.round(f.revenue), Math.round(f.profit)].join(',')
      ).join('\n');
      const csv = '\uFEFF' + header + rows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'group-' + group.name.replace(/\s+/g, '_') + '.csv';
      a.click();
      URL.revokeObjectURL(url);
      toastMsg.success('CSV دانلود شد');
    } catch {
      toastMsg.error('دانلود ناموفق');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={'📊 گزارش گروه • ' + group.name}>
      {/* KPI Card */}
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-border)',
        borderRadius: 'var(--r-md)',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>{TYPE_ICON[group.type]}</span>
          <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{group.name}</span>
          <span style={{ fontSize: 10, background: 'var(--card)', padding: '1px 6px', borderRadius: 4, color: 'var(--muted)' }}>
            {TYPE_LABEL[group.type]}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 'var(--fs-sm)' }}>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10 }}>گله‌ها</div>
            <div style={{ fontWeight: 700 }}>{toFa(kpi.flockCount)} ({toFa(kpi.liveFlockCount)} فعال)</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10 }}>پرنده</div>
            <div style={{ fontWeight: 700 }}>{toFa(kpi.totalCurrent)} از {toFa(kpi.totalInitial)}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10 }}>تلفات</div>
            <div style={{ fontWeight: 700, color: mortalityTone }}>
              {toFa(kpi.totalDeaths)} ({toFa(kpi.mortalityRate.toFixed(1))}٪)
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', fontSize: 10 }}>سود</div>
            <div style={{ fontWeight: 700, color: profitTone }}>{fmtMoney(kpi.totalProfit)} ت</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--accent-border)', fontSize: 11 }}>
          <span>💰 هزینه: <b>{fmtMoney(kpi.totalCost)}</b></span>
          <span>📈 فروش: <b>{fmtMoney(kpi.totalRevenue)}</b></span>
        </div>
      </div>

      {/* Flocks Table */}
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, marginBottom: 6 }}>📋 گله‌های گروه</div>

      {kpi.byFlock.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
          هیچ گله‌ای در این گروه نیست
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {kpi.byFlock.map(f => {
            const isLive = f.status === 'active';
            const fTone = f.profit > 0 ? 'var(--accent)' : f.profit < 0 ? 'var(--danger)' : 'var(--muted)';
            return (
              <div
                key={f.id}
                style={{
                  padding: 'var(--pad-normal)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  opacity: isLive ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{f.name}</span>
                  <span style={{
                    fontSize: 10,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: isLive ? 'var(--accent-soft)' : 'var(--muted-soft)',
                    color: isLive ? 'var(--accent)' : 'var(--muted)',
                  }}>
                    {STATUS_LABEL[f.status] || f.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)' }}>
                  <span>🐔 <b style={{ color: 'var(--text)' }}>{toFa(f.currentCount)}</b>/{toFa(f.initialCount)}</span>
                  <span>🎂 {toFa(f.ageDays)} روز</span>
                  <span>💰 {fmtMoney(f.cost)}</span>
                  <span>📈 {fmtMoney(f.revenue)}</span>
                  <span style={{ color: fTone, fontWeight: 700 }}>{f.profit >= 0 ? '+' : ''}{fmtMoney(f.profit)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BtnRow>
        <Btn onClick={handleExportCSV} disabled={kpi.byFlock.length === 0}>📥 CSV</Btn>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}
