import { useState, useEffect } from 'react';
import { getLogs, clearLogs, exportLogs, type LogEntry } from '../../cor/logger/logger';
import { getAuditLogs, clearAuditLogs, exportAuditLogs, type AuditEntry } from '../../cor/logger/auditLog';
import { Btn, BtnRow, Empty, Modal } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import { showToast } from '../../cor/store/toast';

type Tab = 'activity' | 'errors';

const ACTION_LABEL: Record<string, string> = {
  add: '➕ افزودن',
  update: '✏️ ویرایش',
  delete: '🗑️ حذف',
  export: '📤 خروجی',
  import: '📥 ورودی',
  restore: '↩️ بازگردانی',
  other: '📝 سایر',
};

const ACTION_TONE: Record<string, string> = {
  add: 'accent',
  update: 'warn',
  delete: 'danger',
  export: 'accent',
  import: 'accent',
  restore: 'warn',
  other: 'dim',
};

export default function LogsTab() {
  const [tab, setTab] = useState<Tab>('activity');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [showClear, setShowClear] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const refresh = () => {
    setLogs(getLogs());
    setAuditLogs(getAuditLogs());
  };

  useEffect(() => { refresh(); }, []);

  const handleClear = () => {
    if (tab === 'activity') clearAuditLogs();
    else clearLogs();
    setShowClear(false);
    refresh();
    showToast('لاگ‌ها پاک شدند', 'success', 2000);
  };

  const handleExport = () => {
    const json = tab === 'activity' ? exportAuditLogs() : exportLogs();
    const filename = tab === 'activity' ? 'PM-AuditLogs-' : 'PM-ErrorLogs-';
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('خروجی ذخیره شد', 'success', 2000);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tab === 'activity' ? exportAuditLogs() : exportLogs());
      showToast('در کلیپ‌بورد کپی شد', 'success', 2000);
    } catch {
      showAlert('✕ خطا در کپی');
    }
  };

  const currentLen = tab === 'activity' ? auditLogs.length : logs.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* ═══ Tabs ═══ */}
      <div role="tablist" style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'activity'}
          onClick={() => { setTab('activity'); setExpandedId(null); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: tab === 'activity' ? 'var(--accent-soft)' : 'transparent',
            color: tab === 'activity' ? 'var(--accent)' : 'var(--muted)',
            border: '1px solid ' + (tab === 'activity' ? 'var(--accent-border)' : 'transparent'),
            borderRadius: 'var(--r-sm)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          📋 فعالیت‌ها {toFa(auditLogs.length) > '۰' ? `(${toFa(auditLogs.length)})` : ''}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'errors'}
          onClick={() => { setTab('errors'); setExpandedId(null); }}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: tab === 'errors' ? 'var(--danger-soft)' : 'transparent',
            color: tab === 'errors' ? 'var(--danger)' : 'var(--muted)',
            border: '1px solid ' + (tab === 'errors' ? 'var(--danger)' : 'transparent'),
            borderRadius: 'var(--r-sm)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ⚠ خطاها {toFa(logs.length) > '۰' ? `(${toFa(logs.length)})` : ''}
        </button>
      </div>

      {/* ═══ آمار ═══ */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {tab === 'activity' ? 'تعداد فعالیت‌های ثبت‌شده' : 'تعداد خطاهای ثبت‌شده'}
          </div>
          <div style={{
            fontSize: 'var(--fs-xl)',
            fontWeight: 700,
            color: currentLen > 0
              ? (tab === 'errors' ? 'var(--danger)' : 'var(--accent)')
              : 'var(--muted)',
            marginTop: 4,
          }}>
            {toFa(currentLen)}
          </div>
        </div>
        <div style={{ fontSize: 36 }}>{tab === 'activity' ? '📋' : (logs.length > 0 ? '⚠' : '✓')}</div>
      </div>

      {/* ═══ دکمه‌ها ═══ */}
      {currentLen > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <Btn size="sm" onClick={handleExport}>📥 خروجی JSON</Btn>
          <Btn size="sm" onClick={handleCopy}>📋 کپی همه</Btn>
        </div>
      ) : null}

      {/* ═══ محتوا: فعالیت‌ها ═══ */}
      {tab === 'activity' && (
        <>
          {auditLogs.length === 0 ? (
            <Empty
              icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>}
              title="هیچ فعالیتی ثبت نشده"
              desc="هر افزودن، ویرایش یا حذف در اینجا نمایش داده می‌شود."
            />
          ) : (
            <>
              {auditLogs.map((entry, i) => {
                const isOpen = expandedId === entry.id;
                const time = new Date(entry.time);
                const timeStr = toFa(time.toLocaleString('fa-IR'));
                const tone = ACTION_TONE[entry.action] || 'dim';
                const label = ACTION_LABEL[entry.action] || entry.action;
                return (
                  <ExpandableCard
                    key={entry.id}
                    accent={tone as any}
                    index={toFa(i + 1)}
                    iconEmoji="📝"
                    title={entry.summary}
                    subtitle={entry.module + ' · ' + timeStr}
                    isOpen={isOpen}
                    onToggle={() => setExpandedId(isOpen ? null : entry.id)}
                    stats={<><span style={{ color: 'var(--' + tone + ')', fontWeight: 700 }}>{label}</span></>}
                  >
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🔖 ماژول</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      {entry.module}
                    </div>

                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>📋 نوع فعالیت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      {label}
                    </div>

                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>💬 خلاصه</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {entry.summary}
                    </div>

                    {entry.details ? (
                      <>
                        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>📎 جزئیات</div>
                        <div style={{ fontSize: 'var(--fs-xs)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', wordBreak: 'break-word' }}>
                          {entry.details}
                        </div>
                      </>
                    ) : null}

                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>⏰ زمان</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      {timeStr}
                    </div>
                  </ExpandableCard>
                );
              })}

              <Btn full variant="danger" onClick={() => setShowClear(true)}>🗑 پاک کردن همه فعالیت‌ها</Btn>
            </>
          )}
        </>
      )}

      {/* ═══ محتوا: خطاها ═══ */}
      {tab === 'errors' && (
        <>
          {logs.length === 0 ? (
            <Empty
              icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>}
              title="هیچ خطایی ثبت نشده"
              desc="تا این لحظه، نرم‌افزار بدون خطا کار کرده است."
            />
          ) : (
            <>
              {logs.map((log, i) => {
                const isOpen = expandedId === log.id;
                const time = new Date(log.time);
                const timeStr = toFa(time.toLocaleString('fa-IR'));
                return (
                  <ExpandableCard
                    key={log.id}
                    accent="warn"
                    index={toFa(i + 1)}
                    iconEmoji="⚠"
                    title={log.message.slice(0, 60) + (log.message.length > 60 ? '...' : '')}
                    subtitle={timeStr}
                    isOpen={isOpen}
                    onToggle={() => setExpandedId(isOpen ? null : log.id)}
                    stats={<><span style={{ color: 'var(--warn)', fontWeight: 700 }}>{log.type}</span></>}
                  >
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>⏰ زمان</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      {timeStr}
                    </div>

                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>📋 نوع</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      {log.type}
                    </div>

                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>💬 پیام</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-sm)', lineHeight: 1.7, wordBreak: 'break-word' }}>
                      {log.message}
                    </div>

                    {log.componentStack ? (
                      <>
                        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>🌳 Stack کامپوننت</div>
                        <div style={{
                          fontSize: 12,
                          fontFamily: 'monospace',
                          padding: 'var(--pad-normal)',
                          background: 'var(--input-bg)',
                          borderRadius: 'var(--r-sm)',
                          color: 'var(--muted)',
                          maxHeight: 150,
                          overflowY: 'auto',
                          direction: 'ltr',
                          textAlign: 'left',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}>
                          {log.componentStack.slice(0, 800)}
                        </div>
                      </>
                    ) : null}

                    {log.url ? (
                      <>
                        <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginTop: 4 }}>🔗 URL</div>
                        <div style={{ fontSize: 'var(--fs-xs)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', direction: 'ltr', textAlign: 'left', wordBreak: 'break-all' }}>
                          {log.url}
                        </div>
                      </>
                    ) : null}
                  </ExpandableCard>
                );
              })}

              <Btn full variant="danger" onClick={() => setShowClear(true)}>🗑 پاک کردن همه خطاها</Btn>
            </>
          )}
        </>
      )}

      {/* ═══ Modal پاک‌سازی ═══ */}
      <Modal
        open={showClear}
        onClose={() => setShowClear(false)}
        title="پاک کردن لاگ‌ها"
        footer={<BtnRow><Btn variant="danger" onClick={handleClear}>پاک کن</Btn><Btn onClick={() => setShowClear(false)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          {tab === 'activity'
            ? `همه‌ی ${toFa(auditLogs.length)} فعالیت ثبت‌شده پاک شوند؟`
            : `همه‌ی ${toFa(logs.length)} خطای ثبت‌شده پاک شوند؟`}
        </div>
      </Modal>
    </div>
  );
}
