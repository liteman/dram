# Signal Monitor

AI-powered news monitoring and analysis engine that watches security certification, AI, and dev tool markets — and emails you when something needs your attention.

## How It Works

Every 30 minutes, Signal Monitor:

1. **Fetches** RSS feeds from 14+ curated sources
2. **Deduplicates** against previously seen articles (Cloudflare KV)
3. **Scores** each item with Claude Haiku: `ignore` / `watch` / `act_now`
4. **Analyzes** `act_now` items with Claude Sonnet for deep intelligence
5. **Emails** you immediately with structured analysis:
   - What happened
   - Why it matters to you
   - What's the move

## Cost Estimate

- **Cloudflare Workers**: Free tier covers this easily (100k requests/day)
- **Claude API**: ~$5–15/month depending on volume (Haiku for scoring, Sonnet for analysis)
- **Resend**: Free tier = 100 emails/day (more than enough)

**Total: ~$5–15/month**

---

## Setup Guide (15–20 minutes)

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Step 1: Create a Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free)
2. Install Wrangler CLI:
   ```bash
   npm install -g wrangler
   ```
3. Authenticate:
   ```bash
   wrangler login
   ```

### Step 2: Set Up Resend (Email)

1. Go to [resend.com](https://resend.com) and create a free account
2. Get your API key from the dashboard
3. **For testing**: You can use `onboarding@resend.dev` as the sender — no domain setup needed
4. **For production**: Add and verify your own domain in Resend, then update `ALERT_FROM_EMAIL` in `wrangler.toml`

### Step 3: Install Dependencies

```bash
cd signal-monitor
npm install
```

### Step 4: Create the KV Namespace

```bash
wrangler kv namespace create SIGNAL_KV
```

This will output something like:
```
{ binding = "SIGNAL_KV", id = "abc123..." }
```

Copy the `id` value and paste it into `wrangler.toml` replacing `YOUR_KV_NAMESPACE_ID`.

### Step 5: Set Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
# Paste your Anthropic API key when prompted

wrangler secret put RESEND_API_KEY
# Paste your Resend API key when prompted

wrangler secret put ALERT_EMAIL
# Enter your email address where you want to receive alerts
```

### Step 6: Update Config

Edit `wrangler.toml`:
- Replace `YOUR_KV_NAMESPACE_ID` with the ID from Step 4
- Set `ALERT_FROM_EMAIL` to `onboarding@resend.dev` (testing) or your verified domain email

### Step 7: Deploy

```bash
npm run deploy
```

That's it. The cron trigger will start running every 30 minutes automatically.

### Step 8: Test It

Trigger a manual run:
```bash
curl -X POST https://signal-monitor.<your-subdomain>.workers.dev/trigger
```

Watch the logs:
```bash
wrangler tail
```

You should see output like:
```
🔄 Signal Monitor run started at 2026-02-22T10:00:00Z
📥 Fetched 87 items from 14 sources
🆕 87 new items after dedup
📊 Scores: 2 act_now, 12 watch, 73 ignore
🧠 Analyzed 2 items
✉️ Alert email sent: "⚡ 2 Signal Alerts — Action Required"
✅ Signal Monitor run completed
```

---

## Customization

### Adding/Removing Sources

Edit `src/sources.ts`. Each source needs:
- `id`: Unique string identifier
- `name`: Human-readable name (shown in emails)
- `url`: RSS/Atom feed URL
- `category`: One of the defined categories
- `type`: Always `"rss"` for now

After editing, redeploy: `npm run deploy`

### Tuning the AI Scoring

Edit `src/prompts.ts`. The two key prompts are:

- `SCORING_SYSTEM_PROMPT`: Controls what gets through the filter. Make it stricter to reduce noise, looser to catch more signals.
- `ANALYSIS_SYSTEM_PROMPT`: Controls the quality and format of analysis in emails.

After editing, redeploy: `npm run deploy`

### Changing the Schedule

Edit the cron in `wrangler.toml`:
```toml
crons = ["*/30 * * * *"]  # Every 30 minutes
crons = ["*/15 * * * *"]  # Every 15 minutes
crons = ["0 * * * *"]     # Every hour
```

### Adding New Categories

1. Add the category type in `src/types.ts`
2. Add sources in `src/sources.ts`
3. Update the scoring prompt in `src/prompts.ts` to cover the new category
4. Add the label in `src/email.ts` `CATEGORY_LABELS`

---

## Architecture

```
src/
├── index.ts      # Worker entry point, cron handler, HTTP routes
├── types.ts      # TypeScript interfaces
├── sources.ts    # Feed configuration (add/remove sources here)
├── prompts.ts    # AI relevance profile (tune scoring here)
├── ingest.ts     # RSS/Atom parser and fetcher
├── dedup.ts      # KV-based deduplication
├── ai.ts         # Claude API integration (Haiku scoring + Sonnet analysis)
└── email.ts      # Resend email formatting and delivery
```

## Future Enhancements (v2)

- Daily digest email for `watch` items (8 AM Bangkok time)
- Crypto & RWA category with CoinGecko/DeFiLlama API sources
- Thailand business environment category
- Web scraping for non-RSS sources
- Slack integration as an alternative to email
- Dashboard UI for managing sources and viewing history
