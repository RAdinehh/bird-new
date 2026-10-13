import { useMemo } from 'react';
import { useFilterSort, FilterBar, getWhsWarningsConfig } from '../../shr/filter';
import { useWhs, UNIT_LABEL, stockWarning, expiryWarning, daysToExpiry, type Item } from './store';
import { Empty, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { WarningGroup } from './helpers';

export default function WarningsPage() {
  const { items } = useWhs();

  // ─── فیلتر/مرتب (از config مرکزی) ───
  const config = useMemo(() => getWhsWarningsConfig(), []);
  const { filtered, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Item>({
    items,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // آیتم‌های هشدار دار (از filtered)
  const lowStock = useMemo(() => filtered.filter(i => stockWarning(i) === 'low'), [filtered]);
  const criticalStock = useMemo(() => filtered.filter(i => stockWarning(i) === 'critical'), [filtered]);
  const expiringSoon = useMemo(() => filtered.filter(i => expiryWarning(i) === 'soon'), [filtered]);
  const expired = useMemo(() => filtered.filter(i => expiryWarning(i) === 'expired'), [filtered]);

  const totalWarnings = lowStock.length + criticalStock.length + expiringSoon.length + expired.length;
  const noRawWarnings = items.filter(i => stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok').length === 0;

  if (noRawWarnings) {
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
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {totalWarnings === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>}
          title="نتیجه‌ای پیدا نشد"
          desc="هیچ هشداری با فیلترهای فعلی هم‌خوانی ندارد."
        />
      ) : (
      <>
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
      </>
      )}
    </PageContainer>
  );
}
