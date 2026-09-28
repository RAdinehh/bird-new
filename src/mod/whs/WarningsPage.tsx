import { useMemo } from 'react';
import { useWhs, CATEGORY_ICON, UNIT_LABEL, stockWarning, expiryWarning, daysToExpiry, type Item } from './store';
import { Empty, PageContainer, Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

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
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--warn)', fontWeight: 700 }}>
          ⚠ {toFa(totalWarnings)} هشدار
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

function WarningGroup({ title, icon, color, items, renderLine }: {
  title: string;
  icon: string;
  color: 'red' | 'amber';
  items: Item[];
  renderLine: (it: Item) => string;
}) {
  const tone: 'red' | 'amber' = color;

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ flex: 1, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{title}</div>
        <Tag tone={tone}>{toFa(items.length)}</Tag>
      </div>

      {items.map(it => (
        <div
          key={it.id}
          style={{
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_ICON[it.category]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--fs-sm)', fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {it.name}
            </div>
            <div style={{
              fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }}>
              {renderLine(it)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
