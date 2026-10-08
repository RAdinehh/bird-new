import { useState, useMemo, useRef } from 'react';
import { safeStorage } from '../../shr/utils/storage';
import { exportAll, validateBackup, importAll, getStats, downloadBackup, readFile, formatSize, type BackupFile } from '../../shr/utils/backup';
import { useSet } from './store';
import { showConfirmAsync } from '../../cor/store/dialog';
import { Btn, BtnRow, Field, Grid2, Select, Modal } from '../../shr/components/ui';
import { toFa, parseFaNum } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import StatsModal from './components/StatsModal';
import RestoreModal from './components/RestoreModal';
import ResetModal from './components/ResetModal';
import { ToggleRow } from './helpers';

export default function BackupTab() {
  const s = useSet();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState(() => getStats());
  const [preview, setPreview] = useState<BackupFile | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const [showRestore, setShowRestore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setStats(getStats());

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleExport = () => {
    try {
      const json = exportAll();
      downloadBackup(json);
      showMsg('✓ پشتیبان دانلود شد — ' + formatSize(json.length), true);
      refresh();
    } catch (e: any) {
      showMsg('✕ ' + (e.message || 'خطا'), false);
    }
  };

  const handleExportSettings = () => {
    try {
      const raw = localStorage.getItem('pm-settings');
      if (!raw) { showMsg('✕ تنظیمات خالی است', false); return; }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PM-Settings-' + Date.now() + '.json';
      a.click();
      URL.revokeObjectURL(url);
      showMsg('✓ تنظیمات صادر شد', true);
    } catch {
      showMsg('✕ خطا', false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFile(file);
      const result = validateBackup(text);
      if (!result.valid) {
        showMsg('✕ ' + result.error, false);
        return;
      }
      setPreview(result.data);
      setShowRestore(true);
    } catch (err: any) {
      showMsg('✕ ' + (err.message || 'خطا'), false);
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const confirmRestore = async () => {
    if (!preview) return;
    if (mergeMode === 'replace') {
      const ok = await showConfirmAsync('تأیید بازیابی', '⚠ تمام داده‌های فعلی پاک می‌شود و با فایل پشتیبان جایگزین می‌شود. مطمئن هستید؟', { danger: true, confirmText: 'بازیابی کن' });
      if (!ok) return;
    }
    const result = importAll(preview, mergeMode);
    if (result.success) {
      showMsg('✓ ' + result.message, true);
      setShowRestore(false);
      setPreview(null);
      setTimeout(() => location.reload(), 1200);
    } else {
      showMsg('✕ ' + result.message, false);
    }
  };

  const clearAll = async () => {
    if (!(await showConfirmAsync('تأیید', '⚠ پاک کردن همه‌ی داده‌ها — قابل بازگشت نیست. مطمئن هستید؟', { danger: true, confirmText: 'بله، ادامه' }))) return;
    if (!(await showConfirmAsync('تأیید', 'این آخرین تأیید است. تمام گله‌ها، معاملات، و تنظیمات پاک می‌شوند.', { danger: true, confirmText: 'بله، ادامه' }))) return;
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('pm-')) safeStorage.remove(k);
    }
    location.reload();
  };

  const previewTotalRecords = useMemo(() => {
    if (!preview) return 0;
    let count = 0;
    for (const v of Object.values(preview.data)) {
      if (v && typeof v === 'object' && (v as any).state) {
        for (const arr of Object.values((v as any).state)) {
          if (Array.isArray(arr)) count += arr.length;
        }
      }
    }
    return count;
  }, [preview]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* پیام */}
      {msg ? (
        <div style={{
          background: msg.ok ? 'var(--accent-soft)' : 'var(--danger-soft)',
          color: msg.ok ? 'var(--accent)' : 'var(--danger)',
          padding: '10px 13px',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          textAlign: 'center',
        }}>
          {msg.text}
        </div>
      ) : null}

      {/* ═══ ۱. پشتیبان‌گیری ═══ */}
      <SettingsGroup
        icon="📤"
        title="پشتیبان‌گیری"
        subtitle={`حجم کل: ${formatSize(stats.totalSize)}`}
        tone="accent"
      >
        <Btn variant="primary" full onClick={handleExport}>
          📥 دریافت پشتیبان کامل (JSON)
        </Btn>

        <Grid2>
          <Btn full onClick={handleExportSettings}>
            ⚙ فقط تنظیمات
          </Btn>
          <Btn full onClick={() => { refresh(); setShowStats(true); }}>
            📊 آمار داده‌ها
          </Btn>
        </Grid2>

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <Btn full onClick={() => fileRef.current?.click()}>
          📂 بازیابی از فایل پشتیبان
        </Btn>
      </SettingsGroup>

      {/* ═══ ۲. پشتیبان خودکار ═══ */}
      <SettingsGroup
        icon="⏱"
        title="پشتیبان خودکار"
        subtitle={s.autoBackup.enabled ? `هر ${toFa(s.autoBackup.intervalHours)} ساعت` : 'غیرفعال'}
        tone="purple"
      >
        <ToggleRow
          label="فعال"
          sub="در localStorage — بدون ارسال به سرور"
          value={s.autoBackup.enabled}
          onChange={() => s.updateSection('autoBackup', { enabled: !s.autoBackup.enabled })}
        />
        {s.autoBackup.enabled ? (
          <Grid2>
            <Field label="فاصله">
              <Select
                value={String(s.autoBackup.intervalHours)}
                onChange={e => s.updateSection('autoBackup', { intervalHours: Math.round(parseFaNum(e.target.value)) })}
              >
                <option value="6">هر ۶ ساعت</option>
                <option value="12">هر ۱۲ ساعت</option>
                <option value="24">هر ۲۴ ساعت</option>
                <option value="48">هر ۲ روز</option>
              </Select>
            </Field>
            <Field label="حداکثر نسخه">
              <Select
                value={String(s.autoBackup.maxVersions)}
                onChange={e => s.updateSection('autoBackup', { maxVersions: Math.round(parseFaNum(e.target.value)) })}
              >
                <option value="3">۳ نسخه</option>
                <option value="5">۵ نسخه</option>
                <option value="10">۱۰ نسخه</option>
              </Select>
            </Field>
          </Grid2>
        ) : null}
      </SettingsGroup>

      {/* ═══ ۳. عملیات حساس — دکمه مستقل ═══ */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 'var(--sp-2)',
      }}>
        <Btn full variant="danger" onClick={() => setShowReset(true)}>
          🗑 پاک کردن همه‌ی داده‌ها
        </Btn>
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--danger)',
          textAlign: 'center',
          lineHeight: 1.7,
        }}>
          این عمل قابل بازگشت نیست
        </div>
      </div>


      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
      />

      <RestoreModal
        open={showRestore}
        onClose={() => { setShowRestore(false); setPreview(null); }}
        preview={preview}
        previewTotalRecords={previewTotalRecords}
        mergeMode={mergeMode}
        setMergeMode={setMergeMode}
        onConfirm={confirmRestore}
      />

      <ResetModal
        open={showReset}
        onClose={() => setShowReset(false)}
        onConfirm={clearAll}
      />
    </div>
  );
}