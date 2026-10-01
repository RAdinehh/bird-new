import { useState, useMemo, useRef } from 'react';
import { exportAll, validateBackup, importAll, getStats, downloadBackup, readFile, formatSize, type BackupFile } from '../../shr/utils/backup';
import { useSet } from './store';
import { showConfirmAsync } from '../../cor/store/dialog';
import { showToast } from '../../cor/store/toast';
import { Btn, BtnRow, Field, Grid2, Input, Modal, Select } from '../../shr/components/ui';
import { toFa, parseFaNum } from '../../shr/utils/fa';
import SettingsGroup from './SettingsGroup';
import { RowToggle, Line, SubSection } from './helpers';

export default function BackupTab() {
  const s = useSet();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState(() => getStats());
  const [preview, setPreview] = useState<BackupFile | null>(null);
  const [mergeMode, setMergeMode] = useState<'replace' | 'merge'>('merge');
  const [showRestore, setShowRestore] = useState(false);
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
      if (k.startsWith('pm-')) localStorage.removeItem(k);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      {msg ? (
        <div style={{
          background: msg.ok ? 'var(--accent-soft)' : 'var(--danger-soft)',
          color: msg.ok ? 'var(--accent)' : 'var(--danger)',
          padding: '10px 13px',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {msg.text}
        </div>
      ) : null}

      {/* آمار حجم */}
      <SettingsGroup icon="📊" title="آمار فعلی" subtitle={formatSize(stats.totalSize)} tone="accent">
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 'var(--pad-normal)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)'
        }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
            حجم کل داده‌ها
          </span>
          <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700 }}>
            {formatSize(stats.totalSize)}
          </span>
        </div>

        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {stats.byModule.map(m => (
            <div key={m.key} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: 'var(--pad-normal)',
              background: 'var(--input-bg)',
              borderRadius: 'var(--r-sm)',
              marginBottom: 4,
              fontSize: 'var(--fs-sm)'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{m.label}</div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                  {toFa(m.records)} رکورد
                </div>
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                {formatSize(m.size)}
              </div>
            </div>
          ))}
        </div>

        <Btn size="sm" full onClick={refresh}>🔄 به‌روزرسانی آمار</Btn>
      </SettingsGroup>

      {/* پشتیبان دستی */}
      <SettingsGroup icon="📤" title="پشتیبان‌گیری" tone="info">
        <SubSection label="دانلود پشتیبان" icon="📤" />
        <Btn variant="primary" full onClick={handleExport}>
          📥 دریافت پشتیبان کامل (JSON)
        </Btn>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          همه‌ی داده‌ها — گله‌ها، معاملات، مخاطبین، تنظیمات و ... در یک فایل
        </div>

        <Btn full onClick={handleExportSettings}>
          ⚙ فقط تنظیمات
        </Btn>
      
        <SubSection label="بازیابی" icon="📥" />
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <Btn full onClick={() => fileRef.current?.click()}>
          📂 انتخاب فایل پشتیبان
        </Btn>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
          قبل از بازیابی، پیش‌نمایش محتوا نمایش داده می‌شود
        </div>
      
        <SubSection label="پشتیبان خودکار" icon="💾" />
        <SubSection label="تنظیمات خودکار" icon="💾" />
        <RowToggle
          label="فعال"
          sub="در localStorage — بدون ارسال به سرور"
          value={s.autoBackup.enabled}
          onChange={() => s.updateSection('autoBackup', { enabled: !s.autoBackup.enabled })}
        />
        {s.autoBackup.enabled ? (
          <Grid2>
            <Field label="فاصله">
              <Select value={String(s.autoBackup.intervalHours)} onChange={e => s.updateSection('autoBackup', { intervalHours: Math.round(parseFaNum(e.target.value)) })}>
                <option value="6">هر ۶ ساعت</option>
                <option value="12">هر ۱۲ ساعت</option>
                <option value="24">هر ۲۴ ساعت</option>
                <option value="48">هر ۲ روز</option>
              </Select>
            </Field>
            <Field label="حداکثر نسخه">
              <Select value={String(s.autoBackup.maxVersions)} onChange={e => s.updateSection('autoBackup', { maxVersions: Math.round(parseFaNum(e.target.value)) })}>
                <option value="3">۳ نسخه</option>
                <option value="5">۵ نسخه</option>
                <option value="10">۱۰ نسخه</option>
              </Select>
            </Field>
          </Grid2>
        ) : null}
      </SettingsGroup>

      {/* امنیت */}
      <SettingsGroup icon="🔐" title="امنیت و نگهداری" tone="warn">
        <SubSection label="پاک کردن داده‌ها" icon="⚠" />
        <SubSection label="عملیات غیرقابل بازگشت" icon="⚠️" />
        <Btn full variant="danger" onClick={() => setShowReset(true)}>
          🗑 پاک کردن همه‌ی داده‌ها
        </Btn>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center', lineHeight: 1.7 }}>
          تمام گله‌ها، معاملات و تنظیمات برای همیشه پاک می‌شوند
        </div>
      </SettingsGroup>

      {/* مودال بازیابی */}
      <Modal
        open={showRestore}
        onClose={() => { setShowRestore(false); setPreview(null); }}
        title="بازیابی پشتیبان"
        footer={
          <BtnRow>
            <Btn variant="primary" onClick={confirmRestore}>بازیابی کن</Btn>
            <Btn onClick={() => { setShowRestore(false); setPreview(null); }}>لغو</Btn>
          </BtnRow>
        }
      >
        {preview ? (
          <>
            <div style={{
              padding: 'var(--pad-comfy)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)',
              display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)',
              fontSize: 'var(--fs-sm)'
            }}>
              <Line l="نسخه‌ی فایل" v={toFa(preview.version)} />
              <Line l="نسخه‌ی ساختار" v={toFa(preview.schemaVersion)} />
              <Line l="تاریخ" v={preview.exportedAt.slice(0, 10)} />
              <Line l="تعداد رکوردها" v={toFa(previewTotalRecords)} />
            </div>

            <Field label="روش بازیابی">
              <Select value={mergeMode} onChange={e => setMergeMode(e.target.value as 'replace' | 'merge')}>
                <option value="merge">➕ ادغام با داده‌های فعلی</option>
                <option value="replace">🔁 جایگزینی کامل (پاک کردن فعلی)</option>
              </Select>
            </Field>

            <div style={{
              padding: 'var(--pad-normal)',
              background: 'var(--warn-soft)',
              border: '1px solid var(--warn)',
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--warn)',
              lineHeight: 1.7
            }}>
              {mergeMode === 'merge'
                ? '➕ داده‌های جدید به داده‌های فعلی اضافه می‌شوند — رکوردهای تکراری بر اساس شناسه ادغام می‌شوند.'
                : '🔁 تمام داده‌های فعلی پاک می‌شوند و با فایل پشتیبان جایگزین می‌شوند.'}
            </div>
          </>
        ) : null}
      </Modal>

      {/* مودال پاک‌سازی */}
      <Modal
        open={showReset}
        onClose={() => setShowReset(false)}
        title="پاک کردن همه‌ی داده‌ها"
        footer={
          <BtnRow>
            <Btn variant="danger" onClick={clearAll}>بله، پاک کن</Btn>
            <Btn onClick={() => setShowReset(false)}>لغو</Btn>
          </BtnRow>
        }
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          ⚠ تمام گله‌ها، سالن‌ها، معاملات، مخاطبین و تنظیمات پاک می‌شوند.
          <br />
          <span style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
            این عمل قابل بازگشت نیست.
          </span>
        </div>
      </Modal>
    </div>
  );
}

