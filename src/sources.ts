import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { FeedSource, SignalCategory } from "./types";

const SOURCES_PATH = join(homedir(), ".dram", "sources.json");

const VALID_TYPES = new Set(["rss", "api", "web"]);
const VALID_CATEGORIES = new Set<string>([
  "security_training",
  "ai_dev_tools",
  "crypto_rwa",
]);

function validateSource(obj: unknown, index: number): FeedSource {
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`sources[${index}]: must be an object`);
  }
  const rec = obj as Record<string, unknown>;

  for (const field of ["id", "name", "type", "url", "category"]) {
    if (typeof rec[field] !== "string" || (rec[field] as string).length === 0) {
      throw new Error(`sources[${index}]: "${field}" must be a non-empty string`);
    }
  }

  if (!VALID_TYPES.has(rec.type as string)) {
    throw new Error(
      `sources[${index}]: "type" must be one of: ${[...VALID_TYPES].join(", ")}`
    );
  }

  if (!VALID_CATEGORIES.has(rec.category as string)) {
    throw new Error(
      `sources[${index}]: "category" must be one of: ${[...VALID_CATEGORIES].join(", ")}`
    );
  }

  return {
    id: rec.id as string,
    name: rec.name as string,
    type: rec.type as FeedSource["type"],
    url: rec.url as string,
    category: rec.category as SignalCategory,
  };
}

export function loadSources(): FeedSource[] {
  if (!existsSync(SOURCES_PATH)) {
    console.error(`\n❌ No sources config found at ${SOURCES_PATH}\n`);
    console.error(`To get started, copy the example file:\n`);
    console.error(`  cp sources.example.json ~/.dram/sources.json\n`);
    console.error(`Then edit ~/.dram/sources.json with your own feeds.\n`);
    process.exit(1);
  }

  const raw = readFileSync(SOURCES_PATH, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse ${SOURCES_PATH}: invalid JSON`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${SOURCES_PATH} must contain a JSON array of feed sources`);
  }

  if (parsed.length === 0) {
    throw new Error(`${SOURCES_PATH} is empty — add at least one feed source`);
  }

  return parsed.map((item, i) => validateSource(item, i));
}
