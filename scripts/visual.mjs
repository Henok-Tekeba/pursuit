import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

await fs.mkdir("screenshots", { recursive: true });
await page.setViewportSize({ width: 1200, height: 800 });
await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/login.png", fullPage: true });
console.log("login title:", await page.title());

await page.fill('input[name="email"]', "elena@pursuit.app");
await page.fill('input[name="password"]', "REDACTED_DEMO_CREDENTIAL!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 30000 });
await page.waitForLoadState("networkidle");
await page.setViewportSize({ width: 1200, height: 900 });
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/dashboard.png", fullPage: true });

const pages = [
  ["applications", "/applications"],
  ["analytics", "/analytics"],
  ["follow-ups", "/follow-ups"],
  ["templates", "/templates"],
  ["emails", "/emails"],
  ["companies", "/companies"],
  ["settings", "/settings"],
  ["new-application", "/applications/new"],
];
for (const [name, path] of pages) {
  await page.goto(`http://localhost:3001${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  console.log(name, "status ok", page.url());
}

await page.goto("http://localhost:3001/applications", { waitUntil: "networkidle" });
const firstHref = await page.locator("table tbody tr").first().locator('a[href^="/applications/"]').first().getAttribute("href");
await page.goto(`http://localhost:3001${firstHref}`, { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/application-detail.png", fullPage: true });
console.log("detail:", page.url());

console.log("errors:", errors);
await browser.close();
