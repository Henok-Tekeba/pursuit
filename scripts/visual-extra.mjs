import { chromium } from "playwright";
import fs from "node:fs/promises";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
await fs.mkdir("screenshots", { recursive: true });

await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
await page.fill('input[name="email"]', "elena@internshiptracker.app");
await page.fill('input[name="password"]', "REDACTED_DEMO_CREDENTIAL!");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard");
await page.waitForLoadState("networkidle");

// Dark mode
await page.getByRole("switch", { name: "Toggle dark mode" }).click();
await page.waitForTimeout(350);
await page.screenshot({ path: "screenshots/dashboard-dark.png", fullPage: true });
await page.goto("http://localhost:3001/applications", { waitUntil: "networkidle" });
await page.waitForTimeout(250);
await page.screenshot({ path: "screenshots/applications-dark.png", fullPage: true });
await page.getByRole("switch", { name: "Toggle dark mode" }).click();

// Command palette
await page.goto("http://localhost:3001/dashboard", { waitUntil: "networkidle" });
await page.keyboard.press("Meta+k");
await page.waitForTimeout(400);
await page.screenshot({ path: "screenshots/command-palette.png", fullPage: true });
await page.keyboard.press("Escape");

// Notifications
await page.getByRole("button", { name: /Notifications/ }).first().click();
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/notifications-popover.png", fullPage: true });
await page.keyboard.press("Escape");

// Mobile
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:3001/dashboard", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/mobile-dashboard.png", fullPage: true });
await page.getByRole("button", { name: "Open navigation" }).click();
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/mobile-menu.png", fullPage: true });
await page.keyboard.press("Escape");
await page.goto("http://localhost:3001/applications", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/mobile-applications.png", fullPage: true });

// Mobile auth
await context.clearCookies();
await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
await page.screenshot({ path: "screenshots/mobile-login.png", fullPage: true });

console.log("errors:", errors);
await browser.close();
