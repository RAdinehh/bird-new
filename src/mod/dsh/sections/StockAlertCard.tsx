/**
 * StockAlertCard — کارت هشدار انبار
 */
import { useFormat } from '../../../shr/units/useFormat';

import { toFa } from '../../../shr/utils/fa';

interface Props {
  stockAlerts: number;
  nav: (p: string) => void;
}

export default function StockAlertCard({ stockAlerts, nav }: Props) {
  const fmt = useFormat();
  if (stockAlerts === 0) return null;
  return (
    <>
{/* ============ ۸. هشدار انبار ============ */}
            {stockAlerts > 0 ? (
              <div role="button" tabIndex={0}
                onClick={() => nav('/whs')}
                style={{
                  padding: 'var(--pad-card)',
                  background: 'var(--warn-soft)',
                  border: '1px solid var(--warn)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 700 }}>
                  📦 هشدار انبار
                </span>
                <span style={{ fontSize: 'var(--fs-md)', color: 'var(--warn)', fontWeight: 700 }}>
                  {fmt.count(stockAlerts)} قلم
                </span>
              </div>
            ) : null}
    </>
  );
}
