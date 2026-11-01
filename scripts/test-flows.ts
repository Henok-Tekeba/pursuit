import { chromium } from "playwright";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3001";
async function main() {
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const errors: string[] = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error" && !message.text().includes("Download the React DevTools")) {
    errors.push(message.text());
  }
});

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

try {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  assert(await page.getByRole("heading", { name: "Welcome back!" }).isVisible(), "login page renders");

  await page.fill('input[name="email"]', "elena@internshiptracker.app");
  await page.fill('input[name="password"]', "REDACTED_DEMO_CREDENTIAL!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  assert(await page.getByRole("heading", { name: "Dashboard" }).isVisible(), "dashboard renders after sign in");

  await page.goto(`${base}/applications/new`, { waitUntil: "networkidle" });
  const unique = `Test Company ${Date.now()}`;
  await page.fill('input[name="companyName"]', unique);
  await page.fill('input[name="companyWebsite"]', "https://example.com");
  await page.fill('input[name="position"]', "Product Design Intern");
  await page.fill('input[name="contactName"]', "Test Contact");
  await page.fill('input[name="contactEmail"]', "contact@example.com");
  await page.fill('input[name="initialEmailSubject"]', "Hello — internship application");
  await page.fill('textarea[name="initialEmailBody"]', "Hi Test Contact,\n\nI would love to discuss the Product Design Intern role.\n\nBest,\nElena");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/applications\/[a-f0-9-]+$/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  assert((await page.locator("body").innerText()).includes(unique), "created application detail renders");
  const applicationUrl = page.url();

  await page.getByRole("button", { name: "Record reply" }).first().click();
  await page.getByRole("dialog").waitFor();
  await page.fill("#email-body", "Hi Elena, thanks for reaching out. Could we talk next week?");
  await page.getByRole("dialog").getByRole("button", { name: "Record reply" }).click();
  await page.getByText("Reply recorded.").waitFor({ timeout: 15_000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Activity/ }).click();
  await page.getByText("Reply received").first().waitFor({ timeout: 15_000 });
  assert((await page.locator("body").innerText()).includes("Reply received"), "inbound reply appears in timeline");

  await page.goto(`${base}/applications`, { waitUntil: "networkidle" });
  await page.fill('input[aria-label="Search applications"]', unique);
  await page.waitForURL(/q=/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
  await page.locator("table").first().getByText(unique, { exact: false }).waitFor({ timeout: 15_000 });
  assert(await page.locator("table").first().getByText(unique, { exact: false }).isVisible(), "search finds application");

  const exportResponse = await context.request.get(`${base}/api/export`);
  assert(exportResponse.ok(), "CSV export succeeds");
  const csv = await exportResponse.text();
  assert(csv.includes(unique), "CSV export contains application");
  assert(csv.includes("Initial email subject"), "CSV has email columns");

  await page.goto(applicationUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "More application actions" }).click();
  await page.getByRole("menuitem", { name: "Delete application" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Delete application" }).click();
  await page.waitForURL("**/applications", { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  assert(!(await page.locator("body").innerText()).includes(unique), "application deleted");

  assert(errors.length === 0, `no browser errors (${errors.join(" | ")})`);
  console.log("All application flows passed.");
} catch (error) {
  console.error("Flow test failed:", error);
  console.error("Browser errors:", errors);
  process.exitCode = 1;
} finally {
  await browser.close();
}
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
