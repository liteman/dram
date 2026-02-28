import { loadSources } from "./src/sources";
import { fetchAllFeeds } from "./src/ingest";
import { dedup, markSeen } from "./src/dedup";
import { scoreItems, analyzeItem } from "./src/ai";
import { writeReport } from "./src/report";
import { AnalyzedItem } from "./src/types";

async function main() {
  console.log(`🔄 Dram run started at ${new Date().toISOString()}`);

  // ── Step 1: Fetch all feeds ──
  const sources = loadSources();
  const rawItems = await fetchAllFeeds(sources);
  console.log(`📥 Fetched ${rawItems.length} items from ${sources.length} sources`);

  if (rawItems.length === 0) {
    console.log("No items fetched, ending run.");
    return;
  }

  // ── Step 2: Dedup against local seen.json ──
  const newItems = dedup(rawItems);
  console.log(`🆕 ${newItems.length} new items after dedup`);

  if (newItems.length === 0) {
    console.log("No new items, ending run.");
    return;
  }

  // Mark all items as seen immediately to prevent reprocessing
  markSeen(newItems);

  // ── Step 3: Score with Haiku ──
  console.log(`🤖 Scoring ${newItems.length} items with Haiku...`);
  const scored = await scoreItems(newItems);

  const actNow = scored.filter((i) => i.score === "act_now");
  const watch = scored.filter((i) => i.score === "watch");
  const ignored = scored.filter((i) => i.score === "ignore");

  console.log(
    `📊 Scores: ${actNow.length} act_now, ${watch.length} watch, ${ignored.length} ignore`
  );

  // ── Step 4: Deep analysis on act_now items ──
  const analyzed: AnalyzedItem[] = [];

  if (actNow.length > 0) {
    console.log(`🧠 Analyzing ${actNow.length} act_now items with Sonnet...`);
    for (const item of actNow) {
      const result = await analyzeItem(item);
      analyzed.push(result);
    }
  }

  // ── Step 5: Write HTML report ──
  if (analyzed.length === 0 && watch.length === 0) {
    console.log("No actionable items — no report this run.");
  } else {
    const filepath = writeReport(analyzed, watch);
    console.log(`📄 Report written to ${filepath}`);
  }

  console.log(`✅ Dram run completed`);
}

main().catch((err) => {
  console.error(`❌ Pipeline error: ${err.message}`);
  process.exit(1);
});
