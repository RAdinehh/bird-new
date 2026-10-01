import { useState, useEffect, useMemo } from 'react';
import { useSwipeTabs } from '../../shr/hooks/useSwipeTabs';
import { useAlt, LEVEL_LABEL, LEVEL_ICON, CATEGORY_LABEL, activeAlerts, countByLevel, type Alert, type AlertLevel } from './store';
import { runRules } from './rules';
import { Btn, BtnRow, Empty, Modal, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa } from '../../shr/utils/fa';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

type TabId = 'active' | 'history';
type FilterLevel = AlertLevel | '';

export default function AlertsPage() {
  const { alerts, dismiss, snooze, restore, remove, clearAll } = useAlt();

  const [tab, setTab] = useState<TabId>('active');
  const swipeRef = useSwipeTabs(['active', 'history'], tab, (id) => setTab(id as TabId));
  const [filterLevel, setFilterLevel] = useState<FilterLevel>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [snoozeDate, setSnoozeDate] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [showClear, setShowClear] = useState(false);

  // اجرای خودکار قواعد در بار اول
  useEffect(() => {
    runRules();
  }, []);

  const active = useMemo(() => {
    let arr = activeAlerts(alerts);
    if (filterLevel) arr = arr.filter(a => a.level === filterLevel);
    return arr.sort((a, b) => {
      const order: Record<AlertLevel, number> = { critical: 0, important: 1, info: 2 };
      return order[a.level] - order[b.level];
    });
  }, [alerts, filterLevel]);

  const history = useMemo(() => {
    let arr = alerts.filter(a => a.status === 'dismissed');
    if (filterLevel) arr = arr.filter(a => a.level === filterLevel);
    return arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [alerts, filterLevel]);

  const counts = countByLevel(alerts);
  const list = tab === 'active' ? active : history;

  const handleRefresh = () => {
    runRules();
  };

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
      showToast('هشدار بازگردانی شد', 'success', 2000);
    } catch (err) {
      showToast('بازگردانی ناموفق', 'error', 2000);
    }
    setUndoData(null);
  };

  return (
    <div ref={swipeRef}>
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: '1px solid var(--border)',
        padding: '0 12px',
        background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11
      }}>
        <div role="button" tabIndex={0} onClick={() => setTab('active')} style={tabStyle(tab === 'active')}>
          فعال
          {counts.total > 0 ? (
            <span style={{
              fontSize: 12,
              background: counts.critical > 0 ? 'var(--danger)' : 'var(--warn)',
              color: '#fff',
              padding: '1px 6px',
              borderRadius: 8,
              fontWeight: 700
            }}>{toFa(counts.total)}</span>
          ) : null}
        </div>
        <div role="button" tabIndex={0} onClick={() => setTab('history')} style={tabStyle(tab === 'history')}>
          تاریخچه ({toFa(alerts.filter(a => a.status === 'dismissed').length)})
        </div>
      </div>

      <PageContainer>
      {undoData && (
        <UndoBar
          label="هشدار حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        {/* خلاصه */}
        {counts.total > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <CountBox label="بحرانی" count={counts.critical} color="danger" icon="🔴" />
            <CountBox label="مهم" count={counts.important} color="warn" icon="🟡" />
            <CountBox label="اطلاعی" count={counts.info} color="info" icon="🔵" />
          </div>
        ) : null}

        {/* فیلتر */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setFilterLevel('')} style={chip(filterLevel === '')}>
            همه
          </button>
          <button onClick={() => setFilterLevel('critical')} style={chip(filterLevel === 'critical')}>
            🔴 بحرانی
          </button>
          <button onClick={() => setFilterLevel('important')} style={chip(filterLevel === 'important')}>
            🟡 مهم
          </button>
          <button onClick={() => setFilterLevel('info')} style={chip(filterLevel === 'info')}>
            🔵 اطلاعی
          </button>
        </div>

        {/* دکمه‌ی refresh */}
        <div style={{ display: 'flex', gap: 6 }}>
          <Btn full onClick={handleRefresh}>🔄 بررسی مجدد</Btn>
          {tab === 'history' && alerts.length > 0 ? (
            <Btn variant="danger" onClick={() => setShowClear(true)}>🗑 پاک‌سازی</Btn>
          ) : null}
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
                  subtitle={CATEGORY_LABEL[a.category] + ' · ' + toFa(a.date)}
                  isOpen={isOpen}
                  onToggle={() => setExpandedId(isOpen ? null : a.id)}
                  badge={<Tag tone={a.level === 'critical' ? 'red' : a.level === 'important' ? 'amber' : 'blue'}>{LEVEL_LABEL[a.level]}</Tag>}
                  stats={
                    <>
                      <span>{a.message}</span>
                    </>
                  }
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
                        <Btn size="sm" onClick={() => setDelId(a.id)} style={{ flex: 1 }}>🗑 حذف</Btn>
                      </>
                    )}
                  </div>
                </ExpandableCard>
              );
            })}
          </>
        )}

        {/* مودال تعویق */}
        <Modal
          open={snoozeId !== null}
          onClose={() => { setSnoozeId(null); setSnoozeDate(''); }}
          title="تعویق هشدار"
          footer={<BtnRow><Btn variant="primary" onClick={confirmSnooze}>ذخیره</Btn><Btn onClick={() => { setSnoozeId(null); setSnoozeDate(''); }}>لغو</Btn></BtnRow>}
        >
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
            این هشدار تا تاریخ انتخاب‌شده پنهان می‌شود
          </div>
          <DatePicker value={snoozeDate} onChange={setSnoozeDate} placeholder="انتخاب تاریخ"  autoToday />
        </Modal>

        {/* مودال حذف */}
        <Modal
          open={delId !== null}
          onClose={() => setDelId(null)}
          title="حذف هشدار"
          footer={<BtnRow><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این هشدار حذف شود؟', { danger: true }); if (!ok) return; const item = alerts.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } remove(idToDel);
              logAction('delete', 'alt', 'حذف از هشدارها'); setDelId(null); showToast('هشدار حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
        >
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>
            حذف این هشدار از تاریخچه؟
          </div>
        </Modal>

        {/* مودال پاک‌سازی همه */}
        <Modal
          open={showClear}
          onClose={() => setShowClear(false)}
          title="پاک‌سازی همه‌ی تاریخچه"
          footer={<BtnRow><Btn variant="danger" onClick={() => { clearAll(); setShowClear(false); }}>همه را پاک کن</Btn><Btn onClick={() => setShowClear(false)}>لغو</Btn></BtnRow>}
        >
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
            تمام هشدارهای بسته‌شده حذف می‌شوند.
            <br />
            <span style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)' }}>
              این عمل قابل بازگشت نیست.
            </span>
          </div>
        </Modal>
      </PageContainer>
    </div>
  );
}

function CountBox({ label, count, color, icon }: { label: string; count: number; color: 'danger' | 'warn' | 'info'; icon: string }) {
  return (
    <div style={{
      padding: '12px 10px', textAlign: 'center',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)',
      opacity: count === 0 ? 0.4 : 1
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
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)',
       fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '11px 14px',
    fontSize: 'var(--fs-base)',
    fontWeight: 600,
    color: active ? 'var(--accent)' : 'var(--muted)',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex', alignItems: 'center', gap: 5,
    borderBottom: active ? '2.5px solid var(--accent)' : '2.5px solid transparent'
  };
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
