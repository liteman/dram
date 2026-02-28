# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dram is an AI-powered news monitoring engine that runs locally as a CLI tool. It fetches RSS feeds, scores articles for relevance using Claude Haiku (via the `claude` CLI), analyzes high-priority items with Claude Sonnet, and writes an HTML report that opens in the browser.

## Commands

- `npm start` — Run the pipeline (`npx tsx run.ts`)

There are no automated tests. Manual testing is done by running `npm start` and reviewing the HTML report.

## Architecture

**Pipeline pattern** — data flows linearly through distinct stages:

```
RSS Feeds → Dedup (JSON file) → Score (Haiku) → Analyze (Sonnet) → HTML Report
ingest.ts    dedup.ts             ai.ts          ai.ts              report.ts
```

**Entry point:** `run.ts` — simple top-level async script that orchestrates the pipeline.

### Key modules

- **types.ts** — All shared interfaces (`RawItem` → `ScoredItem` → `AnalyzedItem`)
- **sources.ts** — RSS feed source definitions with two categories: `security_training` and `ai_dev_tools`
- **ingest.ts** — Custom regex-based RSS/Atom parser (no XML library). Fetches all feeds in parallel with 10s timeout per feed; individual feed failures don't break the pipeline
- **dedup.ts** — Uses a local JSON file (`~/.dram/seen.json`) with 30-day expiry to skip already-processed URLs
- **ai.ts** — Shells out to the `claude` CLI for scoring (Haiku, batches of 10) and analysis (Sonnet, individual items). Uses `--system-prompt` flag and stdin pipe for messages
- **prompts.ts** — System prompts that define the relevance scoring profile and analysis format
- **report.ts** — Builds and writes an HTML report to `~/.dram/reports/`, opens in default browser

## Important Patterns

- **`claude` CLI over API:** AI calls use the `claude` CLI subprocess (leveraging Claude Code subscription) instead of direct Anthropic API calls. No API key needed.
- **Graceful degradation:** Feed fetch failures, scoring errors, and analysis errors all have fallbacks — the pipeline continues with partial data rather than failing entirely.
- **Scoring batches:** Items are scored in batches of 10 via a single Claude Haiku call to minimize API costs.
- **Three-tier scoring:** `ignore` (filtered out), `watch` (included in report), `act_now` (gets deep Sonnet analysis).

## Configuration

- **Customization points:** Edit `sources.ts` for feeds, `prompts.ts` for scoring/analysis behavior, `report.ts` for display
- **Data directory:** `~/.dram/` contains `seen.json` (dedup state) and `reports/` (HTML output)
