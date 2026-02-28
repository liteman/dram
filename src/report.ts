import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execSync } from "node:child_process";
import { AnalyzedItem, ScoredItem } from "./types";
import { escapeHtml, sanitizeUrl } from "./sanitize";

const REPORTS_DIR = join(homedir(), ".dram", "reports");

const CATEGORY_LABELS: Record<string, string> = {
  security_training: "🔒 Security & Training",
  ai_dev_tools: "🤖 AI & Dev Tools",
  crypto_rwa: "💰 Crypto & RWA",
};

function buildActNowCard(item: AnalyzedItem): string {
  const url = sanitizeUrl(item.url);
  return `
    <div style="margin-bottom: 28px; padding: 20px; background: #f8f9fa; border-left: 4px solid #e63946; border-radius: 4px;">
      <div style="margin-bottom: 4px;">
        <span style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}
        </span>
        <span style="font-size: 12px; color: #999; margin-left: 8px;">${escapeHtml(item.sourceName)}</span>
      </div>
      <h2 style="margin: 8px 0; font-size: 18px; line-height: 1.3;">
        <a href="${url}" style="color: #1a1a2e; text-decoration: none;">${escapeHtml(item.title)}</a>
      </h2>

      <div style="margin-top: 16px;">
        <h3 style="font-size: 13px; color: #e63946; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">What Happened</h3>
        <p style="margin: 0 0 16px 0; color: #333; font-size: 14px; line-height: 1.6;">${escapeHtml(item.whatHappened)}</p>

        <h3 style="font-size: 13px; color: #e63946; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">Why It Matters to You</h3>
        <p style="margin: 0 0 16px 0; color: #333; font-size: 14px; line-height: 1.6;">${escapeHtml(item.whyItMatters)}</p>

        <h3 style="font-size: 13px; color: #e63946; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px 0;">What's the Move</h3>
        <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.6; font-weight: 500;">${escapeHtml(item.whatsTheMove)}</p>
      </div>

      <div style="margin-top: 14px;">
        <a href="${url}" style="font-size: 13px; color: #457b9d;">Read source →</a>
      </div>
    </div>`;
}

function buildWatchCard(item: ScoredItem): string {
  const url = sanitizeUrl(item.url);
  return `
    <div style="margin-bottom: 16px; padding: 14px 20px; background: #f8f9fa; border-left: 4px solid #457b9d; border-radius: 4px;">
      <div style="margin-bottom: 4px;">
        <span style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">
          ${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}
        </span>
        <span style="font-size: 12px; color: #999; margin-left: 8px;">${escapeHtml(item.sourceName)}</span>
      </div>
      <h3 style="margin: 6px 0 4px 0; font-size: 15px; line-height: 1.3;">
        <a href="${url}" style="color: #1a1a2e; text-decoration: none;">${escapeHtml(item.title)}</a>
      </h3>
      <p style="margin: 0; color: #666; font-size: 13px; line-height: 1.5;">${escapeHtml(item.scoreReason)}</p>
    </div>`;
}

/**
 * Build and write an HTML report to ~/.dram/reports/.
 * Opens the file in the default browser.
 */
export function writeReport(
  analyzed: AnalyzedItem[],
  watch: ScoredItem[]
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const filename = `${timestamp}.html`;
  const filepath = join(REPORTS_DIR, filename);

  const actNowHtml = analyzed.map(buildActNowCard).join("");
  const watchHtml = watch.map(buildWatchCard).join("");

  const totalItems = analyzed.length + watch.length;
  const sources = new Set([...analyzed, ...watch].map((i) => i.sourceName));

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dram Report — ${now.toLocaleDateString()}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee;">
    <h1 style="font-size: 20px; color: #1a1a2e; margin: 0;">🥃 Dram</h1>
    <p style="font-size: 13px; color: #999; margin: 4px 0 0 0;">${now.toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}</p>
  </div>

  ${analyzed.length > 0 ? `
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; color: #e63946; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">🚨 Act Now (${analyzed.length})</h2>
    ${actNowHtml}
  </div>` : ""}

  ${watch.length > 0 ? `
  <div style="margin-bottom: 32px;">
    <h2 style="font-size: 14px; color: #457b9d; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">👀 Watch (${watch.length})</h2>
    ${watchHtml}
  </div>` : ""}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
    Dram — Your AI-powered business intelligence feed<br>
    ${totalItems} item${totalItems !== 1 ? "s" : ""} from ${sources.size} source${sources.size !== 1 ? "s" : ""}
  </div>
</body>
</html>`;

  mkdirSync(REPORTS_DIR, { recursive: true });
  writeFileSync(filepath, html);

  // Open in default browser on macOS
  try {
    execSync(`open "${filepath}"`);
  } catch {
    // Silently ignore if `open` isn't available (non-macOS)
  }

  return filepath;
}
