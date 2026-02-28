import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { RawItem } from "./types";

const DATA_DIR = join(homedir(), ".dram");
const LEGACY_DATA_DIR = join(homedir(), ".signal-monitor");

// Auto-migrate from legacy data directory
if (existsSync(LEGACY_DATA_DIR) && !existsSync(DATA_DIR)) {
  renameSync(LEGACY_DATA_DIR, DATA_DIR);
  console.log(`📦 Migrated data from ~/.signal-monitor to ~/.dram`);
}
const SEEN_FILE = join(DATA_DIR, "seen.json");
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type SeenMap = Record<string, number>; // url → timestamp

function loadSeen(): SeenMap {
  try {
    const raw = readFileSync(SEEN_FILE, "utf-8");
    const data: SeenMap = JSON.parse(raw);

    // Prune entries older than 30 days
    const cutoff = Date.now() - TTL_MS;
    const pruned: SeenMap = {};
    for (const [url, ts] of Object.entries(data)) {
      if (ts > cutoff) pruned[url] = ts;
    }
    return pruned;
  } catch {
    return {};
  }
}

function saveSeen(seen: SeenMap): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}

/**
 * Filter out items we've already processed.
 * Returns only new (unseen) items.
 */
export function dedup(items: RawItem[]): RawItem[] {
  if (items.length === 0) return [];

  const seen = loadSeen();
  return items.filter((item) => !(item.url in seen));
}

/**
 * Mark items as seen so they won't be processed again.
 */
export function markSeen(items: RawItem[]): void {
  const seen = loadSeen();
  const now = Date.now();

  for (const item of items) {
    seen[item.url] = now;
  }

  saveSeen(seen);
}
