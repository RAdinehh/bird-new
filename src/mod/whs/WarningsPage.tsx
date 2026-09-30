import { useMemo } from 'react';
import { useWhs, CATEGORY_ICON, UNIT_LABEL, stockWarning, expiryWarning, daysToExpiry, type Item } from './store';
import { Empty, PageContainer, Tag } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { WarningGroup } from './helpers';

export default function WarningsPage() {
  const { items } = useWhs();

  // آیتم‌های هشدار دار
  const lowStock = useMemo(() => items.filter(i => stockWarning(i) === 'low'), [items]);
  const criticalStock = useMemo(() => items.filter(i => stockWarning(i) === 'critical'), [items]);
  const expiringSoon = useMemo(() => items.filter(i => expiryWarning(i) === 'soon'), [items]);
  const expired = useMemo(() => items.filter(i => expiryWarning(i) === 'expired'), [items]);

  const totalWarnings = lowStock.length + criticalStock.length + expiringSoon.length + expired.length;

  if (totalWarnings === 0) {
    return (
      <PageContainer>
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>}
          title="همه‌چیز مرتب است"
          desc="هیچ هشداری در انبار وجود ندارد."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div style={{
        padding: '14px 16px',
        background: 'var(--warn-soft)',
        border: '1px solid var(--warn)',
        borderRadius: 'var(--r-lg)',
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 700, marginBottom: 10 }}>
          ⚠ {toFa(totalWarnings)} هشدار
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <StatBox icon="⛔" label="منقضی" value={toFa(expired.length)} tone={expired.length > 0 ? 'danger' : 'default'} />
          <Dot />
          <StatBox icon="🔴" label="تمام‌شده" value={toFa(criticalStock.length)} tone={criticalStock.length > 0 ? 'danger' : 'default'} />
          <Dot />
          <StatBox icon="⏰" label="نزدیک انقضا" value={toFa(expiringSoon.length)} tone={expiringSoon.length > 0 ? 'warn' : 'default'} />
          <Dot />
          <StatBox icon="⚠" label="کم" value={toFa(lowStock.length)} tone={lowStock.length > 0 ? 'warn' : 'default'} />
        </div>
      </div>

      {expired.length > 0 ? (
        <WarningGroup
          title="منقضی‌شده"
          icon="⛔"
          color="red"
          items={expired}
          renderLine={(it) => `تاریخ انقضا گذشته — ${toFa(Math.abs(daysToExpiry(it.expireDate) || 0))} روز پیش`}
        />
      ) : null}

      {criticalStock.length > 0 ? (
        <WarningGroup
          title="موجودی تمام‌شده"
          icon="🔴"
          color="red"
          items={criticalStock}
          renderLine={(it) => `موجودی صفر — حداقل ${toFa(it.minStock)} ${UNIT_LABEL[it.unit]}`}
        />
      ) : null}

      {expiringSoon.length > 0 ? (
        <WarningGroup
          title="نزدیک انقضا"
          icon="⏰"
          color="amber"
          items={expiringSoon}
          renderLine={(it) => `${toFa(daysToExpiry(it.expireDate) || 0)} روز تا انقضا`}
        />
      ) : null}

      {lowStock.length > 0 ? (
        <WarningGroup
          title="موجودی کم"
          icon="⚠"
          color="amber"
          items={lowStock}
          renderLine={(it) => `${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]} — حداقل ${toFa(it.minStock)}`}
        />
      ) : null}
    </PageContainer>
  );
}
