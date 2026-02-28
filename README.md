# Dram

AI-powered news monitoring engine that runs locally as a CLI tool. It fetches RSS feeds, scores articles for relevance using Claude Haiku, analyzes high-priority items with Claude Sonnet, and opens an HTML report in your browser.

## How It Works

When you run `npm start`, Dram:

1. **Fetches** RSS feeds from your configured sources
2. **Deduplicates** against previously seen articles (local JSON file)
3. **Scores** each item with Claude Haiku: `ignore` / `watch` / `act_now`
4. **Analyzes** `act_now` items with Claude Sonnet for deep intelligence
5. **Opens** an HTML report in your browser with structured analysis:
   - What happened
   - Why it matters to you
   - What's the move

## Prerequisites

- Node.js 18+
- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude` command available in your terminal)

No API key needed — Dram shells out to the `claude` CLI, which uses your Claude Code subscription.

## Setup

```bash
git clone https://github.com/liteman/dram.git
cd dram
npm install
```

Copy the example sources file and customize it with your own feeds:

```bash
cp sources.example.json ~/.dram/sources.json
```

Edit `~/.dram/sources.json` to add your feeds. Each source needs:

```json
{
  "id": "unique-id",
  "name": "Human-Readable Name",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "category": "ai_dev_tools"
}
```

Available categories: `security_training`, `ai_dev_tools`, `crypto_rwa`

## Usage

```bash
npm start
```

Output looks like:

```
🔄 Dram run started at 2026-02-28T10:00:00Z
📥 Fetched 87 items from 14 sources
🆕 42 new items after dedup
📊 Scores: 2 act_now, 8 watch, 32 ignore
🧠 Analyzing 2 act_now items with Sonnet...
📄 Report written to ~/.dram/reports/dram-2026-02-28T10-00-00.html
✅ Dram run completed
```

The HTML report opens automatically in your default browser.

## Customization

### Tuning the AI Scoring

Edit `src/prompts.ts`. The two key prompts are:

- **`SCORING_SYSTEM_PROMPT`** — Controls what gets through the filter. Make it stricter to reduce noise, looser to catch more signals.
- **`ANALYSIS_SYSTEM_PROMPT`** — Controls the depth and format of analysis for `act_now` items.

### Adding New Categories

1. Add the category type in `src/types.ts`
2. Add sources to `~/.dram/sources.json`
3. Update the scoring prompt in `src/prompts.ts` to cover the new category
4. Add the display label in `src/report.ts` (`CATEGORY_LABELS`)

## Architecture

```
RSS Feeds → Dedup (JSON file) → Score (Haiku) → Analyze (Sonnet) → HTML Report
ingest.ts    dedup.ts             ai.ts          ai.ts              report.ts
```

```
run.ts              Pipeline entry point
src/
├── types.ts        TypeScript interfaces
├── sources.ts      Loads feed config from ~/.dram/sources.json
├── prompts.ts      AI relevance profile (tune scoring here)
├── ingest.ts       RSS/Atom parser and fetcher
├── dedup.ts        JSON file-based deduplication (30-day expiry)
├── ai.ts           Claude CLI integration (Haiku scoring + Sonnet analysis)
├── report.ts       HTML report builder
└── sanitize.ts     HTML/URL sanitization for untrusted feed content
```

### Data Directory

All local state lives in `~/.dram/`:

- `sources.json` — Your feed configuration
- `seen.json` — Dedup state (URLs seen in the last 30 days)
- `reports/` — Generated HTML reports
