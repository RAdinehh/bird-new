/**
 * ContactTabPanel — محتوای یک تب از مخاطبین (carousel)
 */
import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../../shr/hooks/useFab';
import { useCtc, type Person, type Role, ROLE_LABEL, CUSTOMER_TYPES, SUPPLIER_TYPES, SALARY_TYPES, avatarLetter } from '../store';
import { Btn, Empty, PageContainer, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../../shr/multiSelect/MultiSelectBar';
import { useFilterSort, FilterBar, getCtcContactsConfig } from '../../../shr/filter';
import HelpBanner from '../../../shr/components/HelpBanner';
import { toFa } from '../../../shr/utils/fa';
import UndoBar from '../../../cor/ui/UndoBar';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { logAction } from '../../../cor/logger/auditLog';
import { Row } from '../helpers';

type TabId = 'all' | 'customer' | 'supplier' | 'worker';

interface Props {
  tab: TabId;
  active: boolean;
  onEdit: (p: Person) => void;
  onAdd: () => void;
}

export default function ContactTabPanel({ tab, active, onEdit, onAdd }: Props) {
  const { contacts, add, remove } = useCtc();
  const [undoData, setUndoData] = useState<{ item: Person | Person[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useFab(active ? { label: 'افزودن مخاطب', onClick: onAdd } : null);

  // مرحله ۱: tab
  const tabFiltered = useMemo(() => {
    if (tab === 'all') return contacts;
    return contacts.filter(c => c.roles.includes(tab as Role));
  }, [contacts, tab]);

  // مرحله ۲: FilterBar
  const config = useMemo(() => getCtcContactsConfig(), []);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<Person>({
    items: tabFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const ms = useMultiSelect({
    items: list,
    getId: (p: Person) => p.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' مخاطب حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: Person[] = [];
      for (const id of ids) {
        const item = contacts.find(c => c.id === id);
        if (!item) continue;
        backups.push(item);
        try { remove(id); } catch { /* silent */ }
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'مخاطب');
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      const arr = Array.isArray(item.item) ? item.item : [item.item];
      arr.forEach(p => add(p));
      toastMsg.restoredBulk(arr.length, 'مخاطب');
    } catch {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  if (!active) return null;

  return (
    <PageContainer>
      <HelpBanner
        id="ctc-intro"
        icon="👥"
        title="مخاطبین"
        description="مشتریان، تأمین‌کنندگان و کارگران را اینجا ثبت کنید. هر مخاطب می‌تواند نقش‌های مختلف داشته باشد. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />
      {undoData && (
        <UndoBar label="مخاطب حذف شد" onUndo={undoDelete} onDismiss={() => setUndoData(null)} />
      )}

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

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{
              padding: '4px 10px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--muted)',
              fontFamily: 'inherit',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}
          title={hasActiveFilters ? 'نتیجه‌ای پیدا نشد' : 'هنوز مخاطبی ثبت نشده'}
          desc={hasActiveFilters ? 'فیلترها را تغییر دهید یا پاک کنید.' : 'اولین مخاطب خود را بسازید.'}
          action={!hasActiveFilters ? <Btn variant="primary" onClick={onAdd}>+ افزودن مخاطب</Btn> : undefined}
        />
      ) : (
        <>
          {list.map((p, i) => {
            const primaryRole: Role = p.roles.includes('supplier') ? 'supplier' : p.roles.includes('worker') ? 'worker' : 'customer';
            const accent = primaryRole === 'worker' ? 'purple' : primaryRole === 'supplier' ? 'accent' : 'info';
            const isOpen = !ms.selectionMode && expandedId === p.id;
            return (
              <ExpandableCard
                key={p.id}
                id={p.id}
                ms={ms}
                accent={accent as 'accent' | 'info' | 'purple'}
                index={toFa(i + 1)}
                iconEmoji={avatarLetter(p.name)}
                title={p.name}
                subtitle={`${p.phone || '—'}${p.city ? ` · ${p.city}` : ''}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : p.id)}
                badge={
                  <div style={{ display: 'flex', gap: 3 }}>
                    {p.roles.map(r => (
                      <Tag key={r} tone={(r === 'customer' ? 'blue' : r === 'supplier' ? 'green' : 'purple') as 'blue' | 'green' | 'purple'}>
                        {ROLE_LABEL[r]}
                      </Tag>
                    ))}
                  </div>
                }
                stats={<>
                  {p.roles.includes('customer') && p.trustScore ? <span>اعتبار: <b style={{ color: 'var(--text)' }}>{toFa(p.trustScore)}/۱۰</b></span> : null}
                  {p.roles.includes('worker') && p.position ? <span>سمت: <b style={{ color: 'var(--text)' }}>{p.position}</b></span> : null}
                  {p.roles.includes('supplier') && p.supplierTypes.length > 0 ? <span>کالاها: <b style={{ color: 'var(--text)' }}>{toFa(p.supplierTypes.length)}</b></span> : null}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📞 اطلاعات تماس</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="تلفن اصلی" v={p.phone || '—'} />
                  {p.phone2 && <Row l="تلفن دوم" v={p.phone2} />}
                  {p.email && <Row l="ایمیل" v={p.email} />}
                  {p.nationalId && <Row l="کد ملی" v={p.nationalId} />}
                </div>

                {(p.city || p.address) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                       background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>
                      {p.city && <div>{p.city}</div>}
                      {p.address && <div style={{ color: 'var(--muted)' }}>{p.address}</div>}
                    </div>
                  </>
                )}

                {p.roles.includes('customer') && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🛒 اطلاعات مشتری</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Row l="نوع" v={CUSTOMER_TYPES.find(x => x[0] === p.customerType)?.[1] || '—'} />
                      {p.trustScore && <Row l="اعتبار" v={`${toFa(p.trustScore)} از ۱۰`} />}
                      {p.defaultDiscount && <Row l="تخفیف پیش‌فرض" v={`${toFa(p.defaultDiscount)}٪`} />}
                    </div>
                  </>
                )}

                {p.roles.includes('supplier') && p.supplierTypes.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📦 کالاهای فروشنده</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {p.supplierTypes.map(t => (
                        <span key={t} style={{
                          padding: '4px 10px', background: 'var(--accent-soft)',
                          color: 'var(--accent)', borderRadius: 6, fontSize: 'var(--fs-xs)',
                          fontWeight: 600,
                        }}>
                          {SUPPLIER_TYPES.find(x => x[0] === t)?.[1] || t}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {p.roles.includes('worker') && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>👷 اطلاعات کارگر</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.position && <Row l="سمت" v={p.position} />}
                      {p.startDate && <Row l="تاریخ شروع" v={toFa(p.startDate)} />}
                      {p.salaryAmount && <Row l={`حقوق ${SALARY_TYPES.find(x => x[0] === p.salaryType)?.[1] || ''}`} v={`${toFa(p.salaryAmount.toLocaleString('fa-IR'))} ت`} />}
                      {p.insurance && <Row l="بیمه" v="دارد" accent />}
                    </div>
                  </>
                )}

                {p.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{p.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-1)' }}>
                  <Btn size="sm" onClick={() => onEdit(p)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const ok = await showConfirmAsync('تأیید حذف', 'این مخاطب حذف شود؟', { danger: true });
                    if (!ok) return;
                    setUndoData({ item: p });
                    setTimeout(() => setUndoData((cur) => cur && !Array.isArray(cur.item) && cur.item.id === p.id ? null : cur), 6000);
                    remove(p.id);
                    logAction('delete', 'ctc', 'حذف از مخاطبین');
                    toastMsg.deleted('مخاطب');
                  }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />
    </PageContainer>
  );
}
