/**
 * Data Loader for HSTC API
 *
 * Loads EN/SEN notes and chapter data from JSON files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ChapterFullDetail, SENChapterDetail, ChapterIndex } from './types.js';

// Get current directory (ES module equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache for loaded data
let enNotesCache: ChapterFullDetail[] | null = null;
let senNotesCache: SENChapterDetail[] | null = null;
let chaptersCache: ChapterIndex[] | null = null;

/**
 * Load Explanatory Notes (EN) data
 */
export function loadENNotes(): ChapterFullDetail[] {
  if (enNotesCache) {
    return enNotesCache;
  }

  try {
    const dataPath = path.join(__dirname, '../data/en-notes.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    enNotesCache = JSON.parse(rawData);
    console.log(`✅ Loaded ${enNotesCache!.length} EN chapters`);
    return enNotesCache!;
  } catch (error) {
    console.error('❌ Error loading EN notes:', error);
    throw new Error('Failed to load EN notes data');
  }
}

/**
 * Load Supplementary Explanatory Notes (SEN) data
 */
export function loadSENNotes(): SENChapterDetail[] {
  if (senNotesCache) {
    return senNotesCache;
  }

  try {
    const dataPath = path.join(__dirname, '../data/sen-notes.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    senNotesCache = JSON.parse(rawData);
    console.log(`✅ Loaded ${senNotesCache!.length} SEN chapters`);
    return senNotesCache!;
  } catch (error) {
    console.error('❌ Error loading SEN notes:', error);
    throw new Error('Failed to load SEN notes data');
  }
}

/**
 * Load chapters index
 */
export function loadChapters(): ChapterIndex[] {
  if (chaptersCache) {
    return chaptersCache;
  }

  try {
    const dataPath = path.join(__dirname, '../data/chapters.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    chaptersCache = JSON.parse(rawData);
    console.log(`✅ Loaded ${chaptersCache!.length} chapters index`);
    return chaptersCache!;
  } catch (error) {
    console.error('❌ Error loading chapters:', error);
    throw new Error('Failed to load chapters data');
  }
}

/**
 * Preload all data at server startup
 */
export function preloadData(): void {
  console.log('📦 Preloading data...');
  loadENNotes();
  loadSENNotes();
  loadChapters();
  console.log('✅ All data preloaded successfully\n');
}
