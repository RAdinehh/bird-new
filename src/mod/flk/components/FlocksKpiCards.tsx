/**
 * FlocksKpiCards — ۳ کارت KPI بالای لیست گله‌ها
 * متصل به کامپوننت مشترک KpiCard
 */
import { KpiCard } from '../../../shr/components/ui/KpiCard';
import { useFormat } from '../../../shr/units/useFormat';

interface Props {
  totalFlocks: number;
  totalBirds: number;
  totalValue: number;
}

export default function FlocksKpiCards({ totalFlocks, totalBirds, totalValue }: Props) {
  const fmt = useFormat();
  if (totalFlocks === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: 'var(--sp-2)',
    }}>
      <KpiCard
        icon="flocks_group"
        label="کل گله‌ها"
        value={fmt.count(totalFlocks)}
        unit="گله"
        tone="accent"
      />
      <KpiCard
        icon="flock"
        label="کل پرنده‌ها"
        value={fmt.count(totalBirds)}
        unit="پرنده"
        tone="purple"
      />
      <KpiCard
        icon="💰"
        label="ارزش کل"
        value={fmt.money(totalValue)}
        unit="ت"
        tone="info"
      />
    </div>
  );
}
