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

    await page.getByRole("button", { name: "Open demo" }).click();
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
    await page.waitForLoadState("networkidle");
    assert(await page.getByRole("heading", { name: "Dashboard" }).isVisible(), "demo dashboard renders");
    assert(
      (await page.locator("body").innerText()).includes("read-only"),
      "demo shows the read-only notice",
    );

    await page.goto(`${base}/applications?q=Loom`, { waitUntil: "networkidle" });
    await page.locator("table").first().getByText("Loom", { exact: false }).waitFor({ timeout: 15_000 });
    assert((await page.locator("body").innerText()).includes("Loom"), "search finds demo application");

    const exportResponse = await context.request.get(`${base}/api/export`);
    assert(exportResponse.ok(), "CSV export succeeds for demo");
    const csv = await exportResponse.text();
    assert(csv.includes("Loom"), "CSV export contains demo data");

    await page.goto(`${base}/follow-ups`, { waitUntil: "networkidle" });
    assert((await page.locator("body").innerText()).includes("Follow-ups"), "follow-ups page renders");
    await page.goto(`${base}/templates`, { waitUntil: "networkidle" });
    assert((await page.locator("body").innerText()).includes("Templates"), "templates page renders");
    await page.goto(`${base}/settings`, { waitUntil: "networkidle" });
    assert((await page.locator("body").innerText()).includes("read-only"), "settings remains view-only");

    assert(errors.length === 0, `no browser errors (${errors.join(" | ")})`);
    console.log("All read-only demo flows passed.");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("Demo flow test failed:", error);
  process.exitCode = 1;
});
