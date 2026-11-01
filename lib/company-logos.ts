const LOGO_DOMAINS = new Set([
  "airtable.com",
  "anthropic.com",
  "databricks.com",
  "duolingo.com",
  "figma.com",
  "linear.app",
  "loom.com",
  "mercury.com",
  "notion.so",
  "ramp.com",
  "retool.com",
  "stripe.com",
  "superhuman.com",
  "thebrowser.company",
  "vercel.com",
]);

export function companyLogoUrl(domain: string | null | undefined) {
  if (!domain) return null;
  const normalized = domain.trim().toLowerCase().replace(/^www\./, "");
  return LOGO_DOMAINS.has(normalized) ? `/logos/${normalized}.png` : null;
}
