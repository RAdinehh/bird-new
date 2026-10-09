/**
 * _exportImport.ts — منطق صادرات و واردات استانداردها
 *
 * Export:
 *   - همه استانداردها (default + custom) → فایل JSON
 *   - فقط custom (تغییرات کاربر)
 *
 * Import:
 *   - اعتبارسنجی Zod
 *   - ۳ حالت: replace | merge | smart
 */
import { DEFAULT_STANDARDS } from './data';
import { useSet } from '../store';
import { validateStandardsFile, buildStandardsFile, type StandardsFile } from './_schema';
import type { BirdStandard } from './types';

// ═══════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════

export type ExportMode = 'all' | 'custom-only' | 'changed';

/**
 * ساخت فایل JSON برای صادرات
 */
export function exportStandards(mode: ExportMode = 'all'): string {
  const custom: Record<string, any> = (useSet.getState().customStandards as any) || {};
  const all: any[] = [];

  if (mode === 'custom-only') {
    // فقط استانداردهای سفارشی (که کاربر تغییر داده)
    for (const [key, std] of Object.entries(custom)) {
      all.push({ ...(std as any), key });
    }
  } else if (mode === 'changed') {
    // فقط اونهایی که با default فرق دارن
    for (const [key, std] of Object.entries(custom)) {
      const def = (DEFAULT_STANDARDS as any)[key];
      if (!def || JSON.stringify(std) !== JSON.stringify(def)) {
        all.push({ ...(std as any), key });
      }
    }
  } else {
    // همه — custom روی default اولویت داره
    const merged: Record<string, any> = {};
    for (const [key, def] of Object.entries(DEFAULT_STANDARDS as any)) {
      merged[key] = custom[key] ? { ...(def as any), ...(custom[key] as any) } : def;
    }
    // استانداردهای custom که در default نیستن
    for (const [key, std] of Object.entries(custom)) {
      if (!merged[key]) merged[key] = std;
    }
    for (const [key, std] of Object.entries(merged)) {
      all.push({ ...(std as any), key });
    }
  }

  const file = buildStandardsFile(all);
  return JSON.stringify(file, null, 2);
}

/**
 * دانلود فایل JSON
 */
export function downloadStandardsJSON(content: string, filename?: string): void {
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = filename || `bird-standards-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════
// IMPORT
// ═══════════════════════════════════════════════

export type ImportMode = 'replace' | 'merge' | 'smart';

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  skipped: number;
  errors?: string[];
  preview?: {
    new: string[];
    updated: string[];
    unchanged: string[];
  };
}

/**
 * پیش‌نمایش import (قبل از اعمال)
 */
export function previewImport(jsonText: string, mode: ImportMode): ImportResult {
  const validation = validateStandardsFile(jsonText);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'فایل معتبر نیست',
      imported: 0,
      skipped: 0,
    };
  }

  const incoming = validation.data!.standards;
  const custom = useSet.getState().customStandards || {};

  const newOnes: string[] = [];
  const updated: string[] = [];
  const unchanged: string[] = [];

  for (const std of incoming) {
    const key = std.key;
    const existing = custom[key];
    const def = (DEFAULT_STANDARDS as any)[key];

    if (!existing && !def) {
      newOnes.push(std.nameFa || key);
    } else if (existing) {
      // چک تغییر نسبت به custom فعلی
      if (JSON.stringify(existing) !== JSON.stringify(std)) {
        updated.push(std.nameFa || key);
      } else {
        unchanged.push(std.nameFa || key);
      }
    } else if (def) {
      // استاندارد جدید از فایل که قبلاً در default بود
      if (JSON.stringify(def) !== JSON.stringify(std)) {
        updated.push(std.nameFa || key);
      } else {
        unchanged.push(std.nameFa || key);
      }
    }
  }

  return {
    success: true,
    message: 'پیش‌نمایش آماده',
    imported: newOnes.length + updated.length,
    skipped: unchanged.length,
    preview: {
      new: newOnes,
      updated,
      unchanged,
    },
  };
}

/**
 * اعمال import
 */
export function applyImport(jsonText: string, mode: ImportMode): ImportResult {
  const validation = validateStandardsFile(jsonText);
  if (!validation.valid) {
    return {
      success: false,
      message: validation.error || 'فایل معتبر نیست',
      imported: 0,
      skipped: 0,
    };
  }

  const file: StandardsFile = validation.data!;
  const setState = useSet.getState();
  const existingCustom = setState.customStandards || {};
  const nextCustom: Record<string, BirdStandard> = mode === 'replace' ? {} : { ...existingCustom };

  let imported = 0;
  let skipped = 0;

  for (const std of file.standards) {
    const key = std.key;
    const current = existingCustom[key];
    const def = (DEFAULT_STANDARDS as any)[key];

    if (mode === 'replace') {
      // همه چیز جایگزین می‌شه
      nextCustom[key] = std as BirdStandard;
      imported++;
    } else if (mode === 'merge') {
      // فقط جدیدها اضافه می‌شن، موجودها دست نمی‌خورن
      if (!current) {
        nextCustom[key] = std as BirdStandard;
        imported++;
      } else {
        skipped++;
      }
    } else if (mode === 'smart') {
      // هوشمند: فقط اگه کاربر قبلاً تغییر نداده
      if (!current) {
        // کاربر تغییر نداده → ورودی رو بپذیر
        if (def && JSON.stringify(def) === JSON.stringify(std)) {
          // ورودی مثل default هست → نیازی به ذخیره نیست
          skipped++;
        } else {
          nextCustom[key] = std as BirdStandard;
          imported++;
        }
      } else {
        // کاربر قبلاً تغییر داده → مال کاربر برنده‌ست
        skipped++;
      }
    }
  }

  // ذخیره در store
  useSet.setState({ customStandards: nextCustom } as any);

  const modeLabel = mode === 'replace' ? 'جایگزینی کامل' : mode === 'merge' ? 'ادغام' : 'ادغام هوشمند';
  return {
    success: true,
    message: `${modeLabel}: ${imported} نژاد وارد شد، ${skipped} نژاد نادیده گرفته شد`,
    imported,
    skipped,
  };
}

// ═══════════════════════════════════════════════
// Helper: خواندن فایل
// ═══════════════════════════════════════════════
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
}
