import { FeedSource } from "./types";

/**
 * RSS & API sources to monitor.
 *
 * To add a new source:
 *  1. Add an entry here with a unique `id`
 *  2. If it's an API (not RSS), set type: "api" and provide a `transform`
 *     function name (handled in ingest.ts)
 *
 * To remove a source: delete or comment out the entry.
 */
export const SOURCES: FeedSource[] = [
  // ─── Security Certification & Training Market ───────────────────

  {
    id: "sans-isc",
    name: "SANS Internet Storm Center",
    type: "rss",
    url: "https://isc.sans.edu/rssfeed.xml",
    category: "security_training",
  },
  {
    id: "hackthebox-blog",
    name: "Hack The Box Blog",
    type: "rss",
    url: "https://www.hackthebox.com/rss/blog/all",
    category: "security_training",
  },
  {
    id: "reddit-comptia",
    name: "r/CompTIA",
    type: "rss",
    url: "https://www.reddit.com/r/CompTIA/.rss",
    category: "security_training",
  },
  {
    id: "blackhills-infosec",
    name: "Black Hills InfoSec",
    type: "rss",
    url: "https://www.blackhillsinfosec.com/feed/",
    category: "security_training",
  },
  {
    id: "helpnetsecurity",
    name: "Help Net Security",
    type: "rss",
    url: "https://www.helpnetsecurity.com/feed/",
    category: "security_training",
  },
  {
    id: "sans-newsbites",
    name: "SANS NewsBites",
    type: "rss",
    url: "https://www.sans.org/newsletters/newsbites/rss",
    category: "security_training",
  },
  {
    id: "darkreading",
    name: "Dark Reading",
    type: "rss",
    url: "https://www.darkreading.com/rss.xml",
    category: "security_training",
  },
  {
    id: "krebs-security",
    name: "Krebs on Security",
    type: "rss",
    url: "https://krebsonsecurity.com/feed/",
    category: "security_training",
  },
  {
    id: "schneier",
    name: "Schneier on Security",
    type: "rss",
    url: "https://www.schneier.com/feed/atom/",
    category: "security_training",
  },
  {
    id: "thehackernews",
    name: "The Hacker News",
    type: "rss",
    url: "https://feeds.feedburner.com/TheHackersNews",
    category: "security_training",
  },

  // ─── AI & Developer Tools Ecosystem ─────────────────────────────

  {
    id: "anthropic-news",
    name: "Anthropic News",
    type: "web",
    url: "https://www.anthropic.com/news",
    category: "ai_dev_tools",
  },
  {
    id: "openai-blog",
    name: "OpenAI Blog",
    type: "rss",
    url: "https://openai.com/blog/rss.xml",
    category: "ai_dev_tools",
  },
  {
    id: "techcrunch-ai",
    name: "TechCrunch AI",
    type: "rss",
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "ai_dev_tools",
  },
  {
    id: "theverge-ai",
    name: "The Verge AI",
    type: "rss",
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    category: "ai_dev_tools",
  },
  {
    id: "hn-frontpage",
    name: "Hacker News Front Page",
    type: "rss",
    url: "https://hnrss.org/frontpage",
    category: "ai_dev_tools",
  },
  {
    id: "github-blog",
    name: "GitHub Blog",
    type: "rss",
    url: "https://github.blog/feed/",
    category: "ai_dev_tools",
  },
  {
    id: "apple-developer-news",
    name: "Apple Developer News",
    type: "rss",
    url: "https://developer.apple.com/news/rss/news.rss",
    category: "ai_dev_tools",
  },

  // ─── Crypto & RWA Tokenization ────────────────────────────────

  {
    id: "coindesk",
    name: "CoinDesk",
    type: "rss",
    url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    category: "crypto_rwa",
  },
  {
    id: "cointelegraph",
    name: "CoinTelegraph",
    type: "rss",
    url: "https://cointelegraph.com/rss",
    category: "crypto_rwa",
  },
  {
    id: "theblock",
    name: "The Block",
    type: "rss",
    url: "https://www.theblock.co/rss.xml",
    category: "crypto_rwa",
  },
  {
    id: "bitcoin-magazine",
    name: "Bitcoin Magazine",
    type: "rss",
    url: "https://bitcoinmagazine.com/feed",
    category: "crypto_rwa",
  },
  {
    id: "dlnews",
    name: "DL News",
    type: "rss",
    url: "https://www.dlnews.com/arc/outboundfeeds/rss/",
    category: "crypto_rwa",
  },
];
