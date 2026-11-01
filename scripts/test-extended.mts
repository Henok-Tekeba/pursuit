import { chromium } from "playwright";

const base = process.env.TEST_BASE_URL ?? "http://localhost:3001";
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

const USER_PASSWORD = "REDACTED_TEST_CREDENTIAL!";
const NEW_PASSWORD = "REDACTED_TEST_CREDENTIAL-Updated!";

async function signUp(name: string, email: string, password: string) {
  await page.goto(`${base}/signup`, { waitUntil: "networkidle" });
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
}

async function signIn(email: string, password: string) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForTimeout(700);
}

async function createApplication(company: string, position: string, withTemplate = false) {
  await page.goto(`${base}/applications/new`, { waitUntil: "networkidle" });
  await page.fill("#companyName", company);
  await page.fill("#companyWebsite", "https://example.org");
  await page.fill("#position", position);
  await page.fill("#contactName", "Jordan Testing");
  await page.fill("#contactEmail", "jordan@example.org");
  if (withTemplate) {
    await page.getByRole("button", { name: /Use a template/ }).click();
    await page.getByRole("menuitem", { name: /Cold outreach/ }).click();
    const subject = await page.inputValue("#initialEmailSubject");
    const body = await page.inputValue("#initialEmailBody");
    assert(subject.length > 5 && body.length > 20, "template fills subject and body");
    assert(!subject.includes("{{company}}"), "template placeholders resolve");
  }
  await page.getByRole("button", { name: "Create application" }).click();
  await page.waitForURL(/\/applications\/[a-f0-9-]+$/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  return page.url();
}

async function main() {
  const stamp = Date.now();
  const userEmail = `qa.${stamp}@example.com`;
  const companyOne = `Northstar Labs ${stamp}`;
  const companyTwo = `Juniper Studio ${stamp}`;

  await signUp("QA Tester", userEmail, USER_PASSWORD);
  assert((await page.locator("body").innerText()).includes("QA Tester"), "signup uses the collected name");
  assert((await page.locator("body").innerText()).includes("No applications yet"), "new account has empty dashboard");
  assert((await page.locator("body").innerText()).includes("0"), "new account metrics start at zero");

  const firstUrl = await createApplication(companyOne, "Product Design Intern", true);
  assert((await page.locator("body").innerText()).includes(companyOne), "application created");
  assert((await page.locator("body").innerText()).includes("Initial email sent"), "initial email saved in timeline");

  // Status change
  await page.getByRole("button", { name: /Change status, currently Applied/ }).click();
  await page.getByRole("menuitem", { name: "Interview", exact: true }).click();
  await page.getByText("Status updated to Interview").first().waitFor({ timeout: 15_000 });
  assert((await page.locator("body").innerText()).includes("Status updated to Interview"), "status timeline entry exists");

  // Notes
  await page.getByRole("tab", { name: /Notes/ }).click();
  await page.fill('textarea[placeholder="What happened? What should future-you remember?"]', "Test note: bring the portfolio to the call.");
  await page.getByRole("button", { name: "Add note" }).click();
  await page.getByText("Note added.").waitFor({ timeout: 15_000 });
  await page.getByText("Test note: bring the portfolio").first().waitFor({ timeout: 15_000 });
  assert((await page.locator("body").innerText()).includes("Test note: bring the portfolio"), "note appears in notes panel");

  // Schedule follow-up
  await page.getByRole("button", { name: "Set date" }).click();
  const scheduleDialog = page.getByRole("dialog");
  const target = new Date();
  target.setDate(target.getDate() + 9);
  const dateValue = target.toISOString().slice(0, 10);
  await scheduleDialog.locator("#schedule-date").fill(dateValue);
  await scheduleDialog.getByRole("button", { name: "Schedule follow-up" }).click();
  await page.getByText("Follow-up scheduled.").first().waitFor({ timeout: 15_000 });

  // Log a follow-up email
  await page.getByRole("button", { name: "Follow up" }).first().click();
  const emailDialog = page.getByRole("dialog");
  await emailDialog.getByRole("button", { name: "Log email" }).click();
  await page.getByText("Email logged.").waitFor({ timeout: 15_000 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /Activity/ }).click();
  await page.getByText("Follow-up sent").first().waitFor({ timeout: 15_000 });

  // Edit
  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.waitForURL(/\/edit$/, { timeout: 20_000 });
  await page.fill("#position", "Senior Product Design Intern");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.waitForURL(/\/applications\/[a-f0-9-]+$/, { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  assert((await page.locator("body").innerText()).includes("Senior Product Design Intern"), "application edit saved");

  // Data isolation + CSV
  const searchResponse = await context.request.get(`${base}/api/search?q=Loom`);
  const searchData = (await searchResponse.json()) as { results: unknown[] };
  assert(Array.isArray(searchData.results) && searchData.results.length === 0, "search never exposes another user's applications");
  const exportResponse = await context.request.get(`${base}/api/export`);
  const csv = await exportResponse.text();
  assert(csv.includes(companyOne), "CSV export includes own application");
  assert(!csv.includes("Loom"), "CSV export excludes other users");

  // Second application and bulk operations
  await createApplication(companyTwo, "Design Intern");
  await page.goto(`${base}/applications`, { waitUntil: "networkidle" });
  await page.getByRole("checkbox", { name: "Select all applications" }).check();
  await page.getByRole("button", { name: "Change status" }).click();
  await page.getByRole("menuitem", { name: "Rejected", exact: true }).click();
  await page.getByText("Updated 2 applications.").waitFor({ timeout: 15_000 });
  await page.reload({ waitUntil: "networkidle" });
  assert((await page.getByText("Rejected").count()) >= 2, "bulk status update applied");
  await page.getByRole("checkbox", { name: "Select all applications" }).check();
  await page.getByRole("button", { name: "Delete" }).last().click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete applications" }).click();
  await page.getByText("2 applications deleted.").waitFor({ timeout: 15_000 });
  await page.waitForTimeout(500);
  assert((await page.locator("body").innerText()).includes("Your first application starts here"), "bulk delete cleared applications");

  // Templates
  await page.goto(`${base}/templates`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "New template" }).click();
  const templateDialog = page.getByRole("dialog");
  await templateDialog.locator("#template-name").fill(`QA Template ${stamp}`);
  await templateDialog.locator("#template-subject").fill("QA subject for {{company}}");
  await templateDialog.locator("#template-body").fill("Hi {{contactName}},\n\nQA body for {{position}}.");
  await templateDialog.getByRole("button", { name: "Create template" }).click();
  await page.getByText("Cold email template created.").waitFor({ timeout: 15_000 });
  const card = page.locator("article").filter({ hasText: `QA Template ${stamp}` }).first();
  await card.getByRole("button", { name: "Template actions" }).click();
  await page.getByRole("menuitem", { name: "Edit template" }).click();
  await page.getByRole("dialog").locator("#template-name").fill(`QA Template Edited ${stamp}`);
  await page.getByRole("dialog").getByRole("button", { name: "Save template" }).click();
  await page.getByText("Template updated.").waitFor({ timeout: 15_000 });
  const editedCard = page.locator("article").filter({ hasText: `QA Template Edited ${stamp}` }).first();
  await editedCard.getByRole("button", { name: "Template actions" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete template" }).click();
  await page.getByText("Template deleted.").waitFor({ timeout: 15_000 });

  // Settings
  await page.goto(`${base}/settings`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Add day").fill("21");
  await page.getByRole("button", { name: "Add interval" }).click();
  await page.getByRole("button", { name: "Save settings" }).click();
  await page.getByText("Settings saved. New applications will use this cadence.").waitFor({ timeout: 15_000 });
  await page.reload({ waitUntil: "networkidle" });
  assert((await page.locator("body").innerText()).includes("Day 21"), "custom follow-up interval persisted");

  // Change password
  await page.goto(`${base}/settings`, { waitUntil: "networkidle" });
  await page.fill("#current-password", USER_PASSWORD);
  await page.fill("#new-password", NEW_PASSWORD);
  await page.getByRole("button", { name: "Update password" }).click();
  await page.getByText("Password updated.").waitFor({ timeout: 15_000 });

  // Password sign-in, rejection, and demo access
  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 20_000 });
  await signIn(userEmail, "definitely-wrong");
  await page.getByText("Incorrect email or password.").waitFor({ timeout: 15_000 });
  await signIn(userEmail, NEW_PASSWORD);
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  assert((await page.locator("body").innerText()).includes("QA Tester"), "password sign-in works");

  await page.getByRole("button", { name: "Open account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login", { timeout: 20_000 });

  // Social auth gracefully explains configuration
  await page.getByRole("button", { name: /Sign In with Google/ }).click();
  await page.getByText(/Google sign-in is available once Supabase Auth is configured/).waitFor({ timeout: 10_000 });

  // Demo access
  await page.getByRole("button", { name: "Open demo" }).click();
  await page.waitForURL("**/dashboard", { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
  assert((await page.locator("body").innerText()).includes("applications tracked"), "demo workspace opens");

  assert(errors.length === 0, `no browser errors (${errors.join(" | ")})`);
  console.log("All extended flows passed.");
}

main()
  .catch((error) => {
    console.error("Extended flow test failed:", error);
    console.error("Browser errors:", errors);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser.close();
  });
