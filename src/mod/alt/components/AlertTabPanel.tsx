/**
 * AlertTabPanel — محتوای یک تب از هشدارها (carousel)
 */
import { useState, useMemo } from 'react';
import { useAlt, LEVEL_LABEL, LEVEL_ICON, CATEGORY_LABEL, activeAlerts, countByLevel, type Alert, type AlertLevel } from '../store';
import { runRules } from '../rules';
import { useFilterSort, FilterBar, getAltAlertsConfig } from '../../../shr/filter';
import { Btn, BtnRow, Empty, Modal, PageContainer, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa } from '../../../shr/utils/fa';
import UndoBar from '../../../cor/ui/UndoBar';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { logAction } from '../../../cor/logger/auditLog';

type TabId = 'active' | 'history';

interface Props {
  tab: TabId;
  active: boolean;
}

export default function AlertTabPanel({ tab, active: isActive }: Props) {
  const { alerts, dismiss, snooze, restore, remove, clearAll } = useAlt();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [snoozeDate, setSnoozeDate] = useState('');
  const [undoData, setUndoData] = useState<{ item: Alert } | null>(null);

  const activeList = useMemo(() => {
    return activeAlerts(alerts).sort((a, b) => {
      const order: Record<AlertLevel, number> = { critical: 0, important: 1, info: 2 };
      return order[a.level] - order[b.level];
    });
  }, [alerts]);

  const historyList = useMemo(() => {
    return alerts.filter(a => a.status === 'dismissed').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [alerts]);

  const counts = countByLevel(alerts);
  const tabFiltered = tab === 'active' ? activeList : historyList;

  const config = useMemo(() => getAltAlertsConfig(), []);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count } = useFilterSort<Alert>({
    items: tabFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const handleRefresh = () => runRules();

  const confirmSnooze = () => {
    if (snoozeId && snoozeDate) {
      snooze(snoozeId, snoozeDate);
      setSnoozeId(null);
      setSnoozeDate('');
    }
  };

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      restore(item.item.id);
      toastMsg.restored('هشدار');
    } catch {
      toastMsg.error('بازگردانی ناموفق');
    }
    setUndoData(null);
  };

  if (!isActive) return null;

  return (
    <PageContainer>
      {undoData && (
        <UndoBar label="هشدار حذف شد" onUndo={undoDelete} onDismiss={() => setUndoData(null)} />
      )}

      {tab === 'active' && counts.total > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          <CountBox label="بحرانی" count={counts.critical} color="danger" icon="🔴" />
          <CountBox label="مهم" count={counts.important} color="warn" icon="🟡" />
          <CountBox label="اطلاعی" count={counts.info} color="info" icon="🔵" />
        </div>
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
        total={totalFiltered}
        count={count}
      />

      <div style={{ display: 'flex', gap: 6 }}>
        <Btn full onClick={handleRefresh}>🔄 بررسی مجدد</Btn>
        {tab === 'history' && alerts.length > 0 && (
          <Btn variant="danger" onClick={async () => {
            const ok = await showConfirmAsync('پاک‌سازی همه‌ی تاریخچه', 'تمام هشدارهای بسته‌شده حذف می‌شوند.\nاین عمل قابل بازگشت نیست.', { danger: true, confirmText: 'همه را پاک کن' });
            if (!ok) return;
            clearAll();
            toastMsg.info('تاریخچه پاک شد');
          }}>🗑 پاک‌سازی</Btn>
        )}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={tab === 'active' ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
          title={tab === 'active' ? 'هیچ هشدار فعالی نیست' : 'تاریخچه خالی است'}
          desc={tab === 'active' ? 'همه‌چیز مرتب است. سیستم به‌طور خودکار بررسی می‌کند.' : 'هشدارهای بسته‌شده اینجا نمایش داده می‌شوند.'}
        />
      ) : (
        <>
          {list.map((a, i) => {
            const isOpen = expandedId === a.id;
            const accent = a.level === 'critical' ? 'warn' : a.level === 'important' ? 'warn' : 'info';
            return (
              <ExpandableCard
                key={a.id}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji={LEVEL_ICON[a.level]}
                title={a.title}
                subtitle={CATEGORY_LABEL[a.category] + ' • ' + toFa(a.date)}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : a.id)}
                badge={<Tag tone={a.level === 'critical' ? 'red' : a.level === 'important' ? 'amber' : 'blue'}>{LEVEL_LABEL[a.level]}</Tag>}
                stats={<><span>{a.message}</span></>}
              >
                <SectionTitle>📋 جزئیات</SectionTitle>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                   padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                   borderRadius: 'var(--r-sm)' }}>
                  {a.message}
                </div>

                <SectionTitle>🔍 اطلاعات</SectionTitle>
                <Row l="سطح" v={LEVEL_LABEL[a.level]} />
                <Row l="دسته" v={CATEGORY_LABEL[a.category]} />
                <Row l="منبع" v={a.source} />
                <Row l="تاریخ هشدار" v={toFa(a.date)} />
                {a.status === 'snoozed' && a.snoozeUntil ? (
                  <Row l="به تعویق تا" v={toFa(a.snoozeUntil)} />
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4, flexWrap: 'wrap' }}>
                  {a.status === 'active' ? (
                    <>
                      <Btn size="sm" onClick={() => { dismiss(a.id); setExpandedId(null); }} style={{ flex: 1 }}>✓ بستن</Btn>
                      <Btn size="sm" onClick={() => setSnoozeId(a.id)} style={{ flex: 1 }}>⏰ تعویق</Btn>
                    </>
                  ) : a.status === 'snoozed' ? (
                    <>
                      <Btn size="sm" onClick={() => { dismiss(a.id); setExpandedId(null); }} style={{ flex: 1 }}>✓ بستن</Btn>
                      <Btn size="sm" onClick={() => restore(a.id)} style={{ flex: 1 }}>🔄 فعال</Btn>
                    </>
                  ) : (
                    <>
                      <Btn size="sm" onClick={() => restore(a.id)} style={{ flex: 1 }}>🔄 بازیابی</Btn>
                      <Btn size="sm" onClick={async () => {
                        const ok = await showConfirmAsync('تأیید حذف', 'این هشدار حذف شود؟', { danger: true });
                        if (!ok) return;
                        setUndoData({ item: a });
                        setTimeout(() => setUndoData((cur) => cur && cur.item.id === a.id ? null : cur), 6000);
                        remove(a.id);
                        logAction('delete', 'alt', 'حذف از هشدارها');
                        toastMsg.deleted('هشدار');
                      }} style={{ flex: 1 }}>🗑 حذف</Btn>
                    </>
                  )}
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      <Modal
        open={snoozeId !== null}
        onClose={() => { setSnoozeId(null); setSnoozeDate(''); }}
        title="تعویق هشدار"
        footer={<BtnRow><Btn variant="primary" onClick={confirmSnooze}>ذخیره</Btn><Btn onClick={() => { setSnoozeId(null); setSnoozeDate(''); }}>لغو</Btn></BtnRow>}
      >
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
          این هشدار تا تاریخ انتخاب‌شده پنهان می‌شود
        </div>
        <DatePicker value={snoozeDate} onChange={setSnoozeDate} placeholder="انتخاب تاریخ" autoToday />
      </Modal>
    </PageContainer>
  );
}

function CountBox({ label, count, color, icon }: { label: string; count: number; color: 'danger' | 'warn' | 'info'; icon: string }) {
  return (
    <div style={{
      padding: '12px 10px', textAlign: 'center',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)',
      opacity: count === 0 ? 0.4 : 1,
    }}>
      <div style={{ fontSize: 'var(--fs-lg)' }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700, marginTop: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--' + color + ')', marginTop: 2 }}>
        {toFa(count)}
      </div>
    </div>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
       padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>{children}</div>
  );
}
