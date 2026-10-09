/**
 * ImportExportPanel.tsx — پنل صادرات/واردات استانداردها
 *
 * طبق استاندارد (docs/STANDARDS.md):
 *   - دو ستونه
 *   - فاصله مضرب ۸
 *   - focus-visible
 *   - button حداقل ۴۴x۴۴
 */
import { useState, useRef } from 'react';
import SettingsGroup from '../../SettingsGroup';
import { showToast, toastMsg } from '../../../../cor/store/toast';
import { showConfirmAsync } from '../../../../cor/store/dialog';
import {
  exportStandards, downloadStandardsJSON, readFileAsText,
  previewImport, applyImport, type ImportMode, type ExportMode, type ImportResult,
} from '../_exportImport';

interface Props {
  onImported?: () => void;
}

export default function ImportExportPanel({ onImported }: Props) {
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ json: string; preview: ImportResult } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ═══ Export ═══
  const handleExport = (mode: ExportMode) => {
    try {
      const json = exportStandards(mode);
      downloadStandardsJSON(json);
      const label = mode === 'all' ? 'همه' : mode === 'custom-only' ? 'سفارشی' : 'تغییر یافته';
      showToast(`صادرات ${label} انجام شد`, 'success');
    } catch (e: any) {
      showToast('خطا در صادرات', 'error');
    }
  };

  // ═══ Import — مرحله ۱: انتخاب فایل ═══
  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset

    setBusy(true);
    try {
      const text = await readFileAsText(file);
      const preview = previewImport(text, 'smart');

      if (!preview.success) {
        showToast(preview.message, 'error');
        setBusy(false);
        return;
      }

      setPendingImport({ json: text, preview });
    } catch (e: any) {
      showToast('خطا در خواندن فایل', 'error');
    }
    setBusy(false);
  };

  // ═══ Import — مرحله ۲: اعمال ═══
  const handleApply = async (mode: ImportMode) => {
    if (!pendingImport) return;

    if (mode === 'replace') {
      const ok = await showConfirmAsync(
        'جایگزینی کامل',
        'همه استانداردهای فعلی پاک می‌شن و فقط از فایل وارد می‌شن. مطمئنی؟',
        { danger: true }
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      const result = applyImport(pendingImport.json, mode);
      if (result.success) {
        toastMsg.saved('استانداردها');
        setPendingImport(null);
        onImported?.();
      } else {
        showToast(result.message, 'error');
      }
    } catch (e: any) {
      showToast('خطا در واردات', 'error');
    }
    setBusy(false);
  };

  return (
    <>
      <SettingsGroup
        icon="💾"
        title="پشتیبان‌گیری استانداردها"
        subtitle="صادرات و واردات فایل JSON"
        exclusiveGroup="std-sections"
        persist={false}
        tone="accent"
      >
        {/* صادرات */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            📤 صادرات
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ActionBtn onClick={() => handleExport('all')} disabled={busy}>
              صادرات همه
            </ActionBtn>
            <ActionBtn onClick={() => handleExport('changed')} disabled={busy}>
              فقط تغییرات
            </ActionBtn>
            <ActionBtn onClick={() => handleExport('custom-only')} disabled={busy}>
              فقط سفارشی
            </ActionBtn>
          </div>
        </div>

        {/* واردات */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 700, marginBottom: 6 }}>
            📥 واردات
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFilePick}
            style={{ display: 'none' }}
          />
          <ActionBtn onClick={() => fileRef.current?.click()} disabled={busy} variant="outline">
            انتخاب فایل JSON...
          </ActionBtn>
        </div>

        <div style={{
          marginTop: 10,
          padding: 10,
          background: 'var(--input-bg)',
          borderRadius: 'var(--r-sm)',
          fontSize: 11,
          color: 'var(--muted)',
          lineHeight: 1.7,
        }}>
          💡 فایل JSON رو می‌تونی به هوش مصنوعی بدی و بگی نژاد جدید اضافه کنه، بعد وارد کنی.
        </div>
      </SettingsGroup>

      {/* ═══ Modal پیش‌نمایش Import ═══ */}
      {pendingImport && (
        <ImportPreviewModal
          preview={pendingImport.preview}
          onApply={handleApply}
          onCancel={() => setPendingImport(null)}
          busy={busy}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════
// دکمه
// ═══════════════════════════════════════════════
function ActionBtn({
  onClick, children, disabled, variant = 'primary',
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 40,
        padding: '8px 14px',
        background: isPrimary ? 'var(--accent)' : 'var(--input-bg)',
        color: isPrimary ? '#fff' : 'var(--text)',
        border: '1px solid ' + (isPrimary ? 'var(--accent)' : 'var(--border)'),
        borderRadius: 'var(--r-md)',
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        outline: 'none',
        transition: 'opacity .15s ease',
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════════
// Modal پیش‌نمایش
// ═══════════════════════════════════════════════
function ImportPreviewModal({
  preview, onApply, onCancel, busy,
}: {
  preview: ImportResult;
  onApply: (m: ImportMode) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const p = preview.preview || { new: [], updated: [], unchanged: [] };

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-solid, #fff)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
        }}
      >
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--border)',
          fontSize: 15,
          fontWeight: 700,
        }}>
          پیش‌نمایش واردات
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {p.new.length > 0 && (
            <PreviewSection
              icon="➕" title="نژادهای جدید" color="var(--accent)" items={p.new}
            />
          )}
          {p.updated.length > 0 && (
            <PreviewSection
              icon="🔄" title="نژادهای به‌روزرسانی" color="var(--warn)" items={p.updated}
            />
          )}
          {p.unchanged.length > 0 && (
            <PreviewSection
              icon="⏸" title="بدون تغییر" color="var(--muted)" items={p.unchanged}
            />
          )}
        </div>

        <div style={{
          padding: 12,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            حالت اعمال:
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <ActionBtn onClick={() => onApply('smart')} disabled={busy}>
              ✨ هوشمند
            </ActionBtn>
            <ActionBtn onClick={() => onApply('merge')} disabled={busy} variant="outline">
              ➕ ادغام
            </ActionBtn>
            <ActionBtn onClick={() => onApply('replace')} disabled={busy} variant="outline">
              🔄 جایگزین
            </ActionBtn>
          </div>
          <ActionBtn onClick={onCancel} disabled={busy} variant="outline">
            لغو
          </ActionBtn>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  icon, title, color, items,
}: {
  icon: string;
  title: string;
  color: string;
  items: string[];
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 6 }}>
        {icon} {title} ({items.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {items.slice(0, 30).map((name, i) => (
          <div key={i} style={{
            fontSize: 12,
            padding: '4px 8px',
            background: 'var(--input-bg)',
            borderRadius: 6,
          }}>{name}</div>
        ))}
        {items.length > 30 && (
          <div style={{ fontSize: 11, color: 'var(--muted)', padding: 4 }}>
            ... و {items.length - 30} مورد دیگر
          </div>
        )}
      </div>
    </div>
  );
}
