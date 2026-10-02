import { describe, it, expect } from 'vitest';
import {
  fileCategory, formatSize,
  CATEGORY_LABEL, CATEGORY_ICON, LINKED_TYPE_LABEL,
} from '../mod/doc/store';

// ═══════════════════════════════════════════════
// fileCategory
// ═══════════════════════════════════════════════
describe('fileCategory', () => {
  it('image/* → image', () => {
    expect(fileCategory('image/png', 'photo.png')).toBe('image');
    expect(fileCategory('image/jpeg', 'x.jpg')).toBe('image');
  });

  it('application/pdf → pdf', () => {
    expect(fileCategory('application/pdf', 'doc.pdf')).toBe('pdf');
  });

  it('audio/* → audio', () => {
    expect(fileCategory('audio/mpeg', 'x.mp3')).toBe('audio');
  });

  it('video/* → video', () => {
    expect(fileCategory('video/mp4', 'x.mp4')).toBe('video');
  });

  it('Excel MIME', () => {
    expect(fileCategory('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'data.xlsx')).toBe('excel');
  });

  it('excel از extension', () => {
    expect(fileCategory('', 'report.xlsx')).toBe('excel');
    expect(fileCategory('', 'data.csv')).toBe('excel');
  });

  it('ناشناخته → other', () => {
    expect(fileCategory('', 'readme.txt')).toBe('other');
    expect(fileCategory('application/zip', 'archive.zip')).toBe('other');
  });

  it('image precedence over extension', () => {
    // عکس با نام .xlsx → image (چون MIME اول چک میشه)
    expect(fileCategory('image/png', 'misnamed.xlsx')).toBe('image');
  });
});

// ═══════════════════════════════════════════════
// formatSize
// ═══════════════════════════════════════════════
describe('formatSize', () => {
  it('0 → 0 B', () => {
    expect(formatSize(0)).toBe('0 B');
  });

  it('500 → 500 B', () => {
    expect(formatSize(500)).toBe('500 B');
  });

  it('1023 → 1023 B', () => {
    expect(formatSize(1023)).toBe('1023 B');
  });

  it('1024 → 1.0 KB', () => {
    expect(formatSize(1024)).toBe('1.0 KB');
  });

  it('2048 → 2.0 KB', () => {
    expect(formatSize(2048)).toBe('2.0 KB');
  });

  it('1 MB → 1.00 MB', () => {
    expect(formatSize(1024 * 1024)).toBe('1.00 MB');
  });

  it('2.5 MB', () => {
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });

  it('10 MB', () => {
    expect(formatSize(10 * 1024 * 1024)).toBe('10.00 MB');
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('CATEGORY_LABEL', () => {
    expect(CATEGORY_LABEL.image).toBeTruthy();
    expect(CATEGORY_LABEL.pdf).toBeTruthy();
    expect(CATEGORY_LABEL.excel).toBeTruthy();
  });
  it('CATEGORY_ICON', () => {
    expect(CATEGORY_ICON.image).toBeTruthy();
  });
  it('LINKED_TYPE_LABEL', () => {
    expect(LINKED_TYPE_LABEL.none).toBeTruthy();
  });
});
