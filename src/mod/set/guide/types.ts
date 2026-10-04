import type { ReactNode } from 'react';

export interface GuideSection {
  /** عنوان بخش */
  title: string;
  /** پاراگراف‌ها (متن ساده، بدون markdown) */
  paragraphs?: string[];
  /** لیست نشانه‌دار */
  bullets?: string[];
  /** جدول اختیاری */
  table?: {
    headers: string[];
    rows: (string | number)[][];
  };
  /** نکته برجسته */
  callout?: {
    tone: 'info' | 'warn' | 'accent' | 'danger';
    text: string;
  };
  /** منبع */
  source?: string;
}

export interface GuideChapter {
  id: string;
  title: string;
  icon: string;
  subtitle: string;
  sections: GuideSection[];
}

export interface GuideContent {
  version: string;
  lastUpdated: string;
  chapters: GuideChapter[];
}
