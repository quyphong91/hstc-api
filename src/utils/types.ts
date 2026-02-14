/**
 * Type Definitions for HSTC API
 */

export type SearchLanguage = 'vi' | 'en';
export type SearchMatchType = 'tokens' | 'exact';

export interface NoteRow {
  type: 'heading' | 'paragraph' | 'list';
  vi: string;
  en: string;
}

export interface ChapterFullDetail {
  chapterNumber: number;
  titleVi: string;
  titleEn: string;
  content: NoteRow[];
}

export interface SENChapterDetail {
  chapterNumber: number;
  titleVi: string;
  titleEn: string;
  content: NoteRow[];
}

export interface ChapterIndex {
  chapterNumber: number;
  titleVi: string;
  titleEn: string;
  hasEN: boolean;
  hasSEN: boolean;
}

export interface NoteMatch {
  hsCode: string;        // The HS Code or Heading (4 digits)
  source: 'sen' | 'en';  // 'sen' = Supplementary Notes, 'en' = Explanatory Notes
  snippet: string;       // Extracted text showing the match
  chapterNumber: number;
}
