/**
 * Search Notes Utility for HSTC API
 *
 * Search across EN and SEN notes for HS code classification
 */

import { loadENNotes, loadSENNotes } from './dataLoader.js';
import type { SearchLanguage, SearchMatchType, NoteMatch } from './types.js';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function matchesAllTokens(lowerText: string, tokens: string[]): boolean {
  return tokens.every(t => lowerText.includes(t));
}

function pickContextKeyword(textLower: string, keyword: string, matchType: SearchMatchType): string {
  if (matchType === 'exact') return keyword;

  const tokens = tokenize(keyword);
  const token = tokens.find(t => textLower.includes(t));
  return token ?? keyword;
}

/**
 * Extracts a substring (~150 chars) surrounding the keyword for context
 */
export function getSnippet(text: string, keyword: string, maxLength: number = 150): string {
  const lowerText = text.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();
  const index = lowerText.indexOf(lowerKeyword);

  if (index === -1) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');

  // Calculate start and end positions to center the keyword
  const keywordLength = keyword.length;
  const contextLength = Math.floor((maxLength - keywordLength) / 2);

  let start = Math.max(0, index - contextLength);
  let end = Math.min(text.length, index + keywordLength + contextLength);

  // Adjust to not cut words
  if (start > 0) {
    const spaceIndex = text.indexOf(' ', start);
    if (spaceIndex !== -1 && spaceIndex < index) {
      start = spaceIndex + 1;
    }
  }

  if (end < text.length) {
    const spaceIndex = text.lastIndexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex > index + keywordLength) {
      end = spaceIndex;
    }
  }

  let snippet = text.substring(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet;
}

/**
 * Extract HS codes from SEN heading text (e.g., "0102.29.11" or "0105.11.10 0105.12.10")
 */
function extractHSCodesFromHeading(headingText: string): string[] {
  const hsCodePattern = /\d{4}(?:\.\d{2}(?:\.\d{2})?)?/g;
  const matches = headingText.match(hsCodePattern);
  return matches || [];
}

/**
 * Get the 4-digit heading code from a full HS code
 */
function getHeadingCode(hsCode: string): string {
  return hsCode.replace(/\./g, '').substring(0, 4);
}

/**
 * Search through Explanatory Notes (EN)
 */
function searchENNotes(keyword: string, language: SearchLanguage, matchType: SearchMatchType): NoteMatch[] {
  const matches: NoteMatch[] = [];
  const lowerKeyword = keyword.toLowerCase();
  const tokens = matchType === 'tokens' ? tokenize(keyword) : [];
  const chapterFullDetailData = loadENNotes();

  for (const chapter of chapterFullDetailData) {
    let currentHeading = chapter.chapterNumber.toString().padStart(2, '0');

    for (const row of chapter.content) {
      const text = language === 'en' && row.en ? row.en : row.vi;
      const lowerText = text.toLowerCase();

      // Check if this is a heading row that might contain HS codes
      if (row.type === 'heading') {
        // Try to extract HS code from heading (e.g., "01.01", "Nhóm 01.02")
        const hsMatch = text.match(/\d{2}\.\d{2}/);
        if (hsMatch) {
          currentHeading = hsMatch[0].replace('.', '');
        }
      }

      const isMatch = matchType === 'exact'
        ? lowerText.includes(lowerKeyword)
        : tokens.length > 0 && matchesAllTokens(lowerText, tokens);

      if (isMatch) {
        const contextKeyword = pickContextKeyword(lowerText, keyword, matchType);
        matches.push({
          hsCode: currentHeading,
          source: 'en',
          snippet: getSnippet(text, contextKeyword),
          chapterNumber: chapter.chapterNumber,
        });
      }
    }
  }

  return matches;
}

/**
 * Search through Supplementary Explanatory Notes (SEN)
 */
function searchSENNotes(keyword: string, language: SearchLanguage, matchType: SearchMatchType): NoteMatch[] {
  const matches: NoteMatch[] = [];
  const lowerKeyword = keyword.toLowerCase();
  const tokens = matchType === 'tokens' ? tokenize(keyword) : [];
  const senNoteDetailData = loadSENNotes();

  for (const chapter of senNoteDetailData) {
    let currentHSCodes: string[] = [];

    for (let i = 0; i < chapter.content.length; i++) {
      const row = chapter.content[i];
      const text = language === 'en' && row.en ? row.en : row.vi;
      const lowerText = text.toLowerCase();

      // If this is a heading, it likely contains HS codes
      if (row.type === 'heading') {
        currentHSCodes = extractHSCodesFromHeading(text);
      }

      if (row.type === 'heading') continue;

      const isMatch = matchType === 'exact'
        ? lowerText.includes(lowerKeyword)
        : tokens.length > 0 && matchesAllTokens(lowerText, tokens);

      if (isMatch) {
        const headingCodes = [...new Set(currentHSCodes.map(getHeadingCode))];
        const contextKeyword = pickContextKeyword(lowerText, keyword, matchType);

        if (headingCodes.length > 0) {
          for (const headingCode of headingCodes) {
            matches.push({
              hsCode: headingCode,
              source: 'sen',
              snippet: getSnippet(text, contextKeyword),
              chapterNumber: chapter.chapterNumber,
            });
          }
        } else {
          // Fallback to chapter number as heading
          matches.push({
            hsCode: chapter.chapterNumber.toString().padStart(2, '0'),
            source: 'sen',
            snippet: getSnippet(text, contextKeyword),
            chapterNumber: chapter.chapterNumber,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Main search function that searches both EN and SEN notes
 */
export function searchNotes(keyword: string, language: SearchLanguage, matchType: SearchMatchType = 'tokens'): NoteMatch[] {
  if (!keyword || keyword.trim().length === 0) {
    return [];
  }

  const enMatches = searchENNotes(keyword.trim(), language, matchType);
  const senMatches = searchSENNotes(keyword.trim(), language, matchType);

  // Combine and deduplicate matches (keep unique by hsCode + source + snippet combination)
  const allMatches = [...senMatches, ...enMatches];

  // Limit snippets per HS code to avoid overwhelming results
  const matchesByCode: Record<string, NoteMatch[]> = {};

  for (const match of allMatches) {
    const key = `${match.hsCode}-${match.source}`;
    if (!matchesByCode[key]) {
      matchesByCode[key] = [];
    }
    // Keep max 2 snippets per HS code per source
    if (matchesByCode[key].length < 2) {
      matchesByCode[key].push(match);
    }
  }

  return Object.values(matchesByCode).flat();
}

/**
 * Search notes with material and function filters
 */
export function searchNotesAdvanced(
  keyword: string,
  language: SearchLanguage,
  material?: string,
  functionFeature?: string,
  matchType: SearchMatchType = 'tokens'
): NoteMatch[] {
  const mainMatches = searchNotes(keyword, language, matchType);

  // If we have additional filters, search for those too
  let materialMatches: NoteMatch[] = [];
  let functionMatches: NoteMatch[] = [];

  if (material && material.trim().length > 0) {
    materialMatches = searchNotes(material.trim(), language, matchType);
  }

  if (functionFeature && functionFeature.trim().length > 0) {
    functionMatches = searchNotes(functionFeature.trim(), language, matchType);
  }

  // Combine all matches
  const allMatches = [...mainMatches, ...materialMatches, ...functionMatches];

  // Deduplicate by creating a unique key
  const uniqueMatches = new Map<string, NoteMatch>();
  for (const match of allMatches) {
    const key = `${match.hsCode}-${match.source}-${match.snippet.substring(0, 50)}`;
    if (!uniqueMatches.has(key)) {
      uniqueMatches.set(key, match);
    }
  }

  return Array.from(uniqueMatches.values());
}
