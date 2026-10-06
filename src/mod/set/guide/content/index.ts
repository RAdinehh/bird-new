import type { GuideContent } from '../types';
import { CHAPTER_INTRO } from './01-intro';
import { CHAPTER_IRAN } from './02-iran';
import { CHAPTER_INTERNATIONAL } from './03-international';
import { CHAPTER_EQUIPMENT } from './04-equipment';
import { CHAPTER_CALCULATIONS } from './05-calculations';
import { CHAPTER_SOURCES } from './06-sources';
import { CHAPTER_GLOSSARY } from './07-glossary';
import { CHAPTER_GROWTH_STAGES } from './08-growth-stages';

export const GUIDE_CONTENT: GuideContent = {
  version: '1.0.0',
  lastUpdated: '1404/07/14',
  chapters: [
    CHAPTER_INTRO,
    CHAPTER_IRAN,
    CHAPTER_INTERNATIONAL,
    CHAPTER_EQUIPMENT,
    CHAPTER_CALCULATIONS,
    CHAPTER_SOURCES,
    CHAPTER_GLOSSARY,
    CHAPTER_GROWTH_STAGES,
  ],
};
