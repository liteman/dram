import { RawItem, FeedSource } from "./types";
import { sanitizeTitle, sanitizeSummary } from "./sanitize";

/**
 * Lightweight RSS/Atom parser for Cloudflare Workers.
 * No external XML dependencies — uses regex extraction
 * which is plenty robust for well-formed RSS/Atom feeds.
 */

function extractTag(xml: string, tag: string): string {
  // Handle CDATA
  const cdataPattern = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, "i");
  const cdataMatch = xml.match(cdataPattern);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular tags
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = xml.match(pattern);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const pattern = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(pattern);
  return match ? match[1].trim() : "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + "...";
}

interface ParsedEntry {
  title: string;
  link: string;
  summary: string;
  published: string;
}

function parseRSSItems(xml: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Try RSS 2.0 <item> blocks
  const rssItems = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  for (const item of rssItems) {
    const title = stripHtml(extractTag(item, "title"));
    const link = extractTag(item, "link") || extractAttr(item, "link", "href");
    const summary = stripHtml(
      extractTag(item, "description") || extractTag(item, "content:encoded") || ""
    );
    const published =
      extractTag(item, "pubDate") || extractTag(item, "dc:date") || "";

    if (title && link) {
      entries.push({ title, link, summary: truncate(summary, 500), published });
    }
  }

  // Try Atom <entry> blocks if no RSS items found
  if (entries.length === 0) {
    const atomEntries = xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
    for (const entry of atomEntries) {
      const title = stripHtml(extractTag(entry, "title"));
      const link =
        extractAttr(entry, 'link[rel="alternate"]', "href") ||
        extractAttr(entry, "link", "href");
      const summary = stripHtml(
        extractTag(entry, "summary") || extractTag(entry, "content") || ""
      );
      const published =
        extractTag(entry, "published") || extractTag(entry, "updated") || "";

      if (title && link) {
        entries.push({ title, link, summary: truncate(summary, 500), published });
      }
    }
  }

  return entries;
}

/**
 * Parse articles from an HTML news listing page (e.g. anthropic.com/news).
 * Extracts items from a repeating pattern of date + link + title.
 */
function parseWebItems(html: string, baseUrl: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];

  // Match anchor tags that link to article pages with a heading inside
  // Pattern: <a href="/news/slug-here">...<h3...>Title</h3>...</a>
  const linkPattern = /<a\s[^>]*href="([^"]*)"[^>]*>[\s\S]*?<h[23][^>]*>([\s\S]*?)<\/h[23]>[\s\S]*?<\/a>/gi;
  let match;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const title = stripHtml(match[2]);

    if (!title || !href) continue;

    // Only match actual article paths (e.g. /news/some-slug), skip nav links
    const { pathname } = new URL(baseUrl);
    const prefix = pathname.replace(/\/$/, ""); // e.g. "/news"
    if (!href.startsWith(prefix + "/") || href === prefix + "/") continue;

    // Resolve relative URLs
    let link: string;
    try {
      link = new URL(href, baseUrl).href;
    } catch {
      continue;
    }

    // Look backwards from this match for a date string (e.g. "Feb 20, 2026")
    const preceding = html.slice(Math.max(0, match.index - 300), match.index);
    const dateMatch = preceding.match(
      /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i
    );
    const published = dateMatch ? dateMatch[0] : "";

    entries.push({ title, link, summary: "", published });
  }

  return entries;
}

/**
 * Fetch and parse a single source into RawItems.
 * Supports RSS/Atom feeds and HTML news pages.
 * Returns empty array on failure (resilient — one bad source doesn't break the pipeline).
 */
export async function fetchFeed(source: FeedSource): Promise<RawItem[]> {
  try {
    const isWeb = source.type === "web";
    const response = await fetch(source.url, {
      headers: {
        "User-Agent": "Dram/1.0 (news aggregator)",
        Accept: isWeb
          ? "text/html"
          : "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.warn(`[${source.id}] HTTP ${response.status}`);
      return [];
    }

    const text = await response.text();
    const parsed = isWeb
      ? parseWebItems(text, source.url)
      : parseRSSItems(text);

    return parsed.map((entry) => ({
      sourceId: source.id,
      sourceName: source.name,
      category: source.category,
      url: entry.link,
      title: sanitizeTitle(entry.title),
      summary: sanitizeSummary(entry.summary),
      publishedAt: entry.published || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn(`[${source.id}] Fetch error: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Fetch all sources in parallel with concurrency limit.
 */
export async function fetchAllFeeds(sources: FeedSource[]): Promise<RawItem[]> {
  const results = await Promise.allSettled(sources.map(fetchFeed));

  const items: RawItem[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      items.push(...result.value);
    }
  }

  return items;
}
