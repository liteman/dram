/**
 * Input sanitization for untrusted RSS/web content.
 *
 * All external content passes through here before being used in
 * Claude prompts or interpolated into HTML reports.
 */

const MAX_TITLE_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 500;

/**
 * Strip control characters (except newlines/tabs) that could confuse
 * prompt parsing or hide injected instructions.
 */
function stripControlChars(text: string): string {
  // Keep \n (0x0A) and \t (0x09), strip everything else in C0/C1 ranges
  return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
}

/**
 * Sanitize a raw feed item's text fields:
 * - Enforce length caps on title and summary
 * - Strip control characters
 */
export function sanitizeTitle(title: string): string {
  let clean = stripControlChars(title).trim();
  if (clean.length > MAX_TITLE_LENGTH) {
    clean = clean.slice(0, MAX_TITLE_LENGTH) + "...";
  }
  return clean;
}

export function sanitizeSummary(summary: string): string {
  let clean = stripControlChars(summary).trim();
  if (clean.length > MAX_SUMMARY_LENGTH) {
    clean = clean.slice(0, MAX_SUMMARY_LENGTH) + "...";
  }
  return clean;
}

/**
 * Escape a string for safe interpolation into HTML.
 * Prevents XSS via RSS titles, AI-generated analysis text, and URLs.
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Sanitize a URL for use in an href attribute.
 * Blocks javascript: and data: URIs that could execute code.
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return "#blocked";
  }
  return escapeHtml(trimmed);
}
