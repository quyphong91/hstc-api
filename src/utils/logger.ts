/**
 * API Request Logger
 *
 * Logs search requests to Supabase for analytics dashboard
 * Async/non-blocking to avoid impacting API response times
 */

import { supabaseClient } from './supabaseClient.js';

interface LogEntry {
  keyword: string;
  language?: string;
  matchType?: string;
  hsCodes: string[];
  totalMatches: number;
  processingTimeMs: number;
  hasResults: boolean;
}

/**
 * Log API request to Supabase
 * Fire-and-forget async operation
 */
export async function logApiRequest(entry: LogEntry): Promise<void> {
  // Skip logging if Supabase client not configured
  if (!supabaseClient) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from('api_logs')
      .insert({
        keyword: entry.keyword,
        language: entry.language || null,
        match_type: entry.matchType || null,
        hs_codes: entry.hsCodes,
        total_matches: entry.totalMatches,
        processing_time_ms: entry.processingTimeMs,
        has_results: entry.hasResults,
      });

    if (error) {
      console.error('Failed to log API request:', error.message);
    }
  } catch (err) {
    // Silent failure - don't break API responses due to logging issues
    console.error('Error logging API request:', err);
  }
}
