import { useFormat } from '../../shr/units/useFormat';
import { useMemo } from 'react';
import { useFilterSort, FilterBar, getWhsWarningsConfig } from '../../shr/filter';
import { useWhs, UNIT_LABEL, stockWarning, expiryWarning, daysToExpiry, type Item } from './store';
import { Empty, PageContainer } from '../../shr/components/ui';
import { StatBox, Dot } from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { WarningGroup } from './helpers';
import HelpBanner from '../../shr/components/HelpBanner';

export default function WarningsPage() {
  const fmt = useFormat();
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
      <HelpBanner
        id="whs-warnings-guide"
        icon="⚠️"
        title="راهنمای هشدارهای انبار"
        description="اقلامی که موجودی‌شان به حد هشدار رسیده یا تاریخ انقضایشان نزدیک است اینجا نمایش داده می‌شوند تا پیش از کمبود یا فاسد شدن اقدام کنید."
        tone="info"
      />
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
          ⚠ {fmt.count(totalWarnings)} هشدار
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
          <StatBox icon="rotten_egg" label="منقضی" value={fmt.count(expired.length)} tone={expired.length > 0 ? 'danger' : 'default'} />
          <Dot />
          <StatBox icon="inventory" label="تمام‌شده" value={fmt.count(criticalStock.length)} tone={criticalStock.length > 0 ? 'danger' : 'default'} />
          <Dot />
          <StatBox icon="cal_7" label="نزدیک انقضا" value={fmt.count(expiringSoon.length)} tone={expiringSoon.length > 0 ? 'warn' : 'default'} />
          <Dot />
          <StatBox icon="stats" label="کم" value={fmt.count(lowStock.length)} tone={lowStock.length > 0 ? 'warn' : 'default'} />
        </div>
      </div>

      {expired.length > 0 ? (
        <WarningGroup
          title="منقضی‌شده"
          icon="rotten_egg"
          color="red"
          items={expired}
          renderLine={(it) => `تاریخ انقضا گذشته — ${fmt.day(Math.abs(daysToExpiry(it.expireDate) || 0))} روز پیش`}
        />
      ) : null}

      {criticalStock.length > 0 ? (
        <WarningGroup
          title="موجودی تمام‌شده"
          icon="inventory"
          color="red"
          items={criticalStock}
          renderLine={(it) => `موجودی صفر — حداقل ${fmt.num(it.minStock)} ${UNIT_LABEL[it.unit]}`}
        />
      ) : null}

      {expiringSoon.length > 0 ? (
        <WarningGroup
          title="نزدیک انقضا"
          icon="cal_7"
          color="amber"
          items={expiringSoon}
          renderLine={(it) => `${fmt.day(daysToExpiry(it.expireDate) || 0)} روز تا انقضا`}
        />
      ) : null}

      {lowStock.length > 0 ? (
        <WarningGroup
          title="موجودی کم"
          icon="stats"
          color="amber"
          items={lowStock}
          renderLine={(it) => `${fmt.num(it.currentStock)} ${UNIT_LABEL[it.unit]} — حداقل ${fmt.num(it.minStock)}`}
        />
      ) : null}
      </>
      )}
    </PageContainer>
  );
}
