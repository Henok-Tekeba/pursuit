import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type JobImportFields = {
  companyName?: string;
  companyWebsite?: string;
  position?: string;
  location?: string;
  jobUrl: string;
};

export type JobImportResult = {
  fields: JobImportFields;
  source: string;
};

export class JobImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobImportError";
  }
}

const MAX_HTML_BYTES = 2_000_000;
const MAX_REDIRECTS = 4;

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const hex = entity[1]?.toLowerCase() === "x";
      const parsed = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : match;
    }
    return named[entity.toLowerCase()] ?? match;
  });
}

function cleanText(value: string | null | undefined) {
  if (!value) return "";
  return decodeEntities(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function isPrivateAddress(address: string): boolean {
  const ip = address.replace(/^\[|\]$/g, "");
  if (isIP(ip) === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;
    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      parts[0] >= 224
    );
  }

  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true;
  if (/^fe[89ab][0-9a-f]?:/i.test(lower) || /^fec[0-9a-f]?:/i.test(lower)) return true;
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice("::ffff:".length);
    return isIP(mapped) === 4 ? isPrivateAddress(mapped) : true;
  }
  return false;
}

function parseUrl(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) throw new JobImportError("Paste a job link first.");
  if (trimmed.length > 500) throw new JobImportError("That link is too long.");

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new JobImportError("Enter a valid job link.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new JobImportError("Only http and https links can be read.");
  }
  if (url.username || url.password) {
    throw new JobImportError("That link contains credentials and can't be read.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new JobImportError("That link uses an unsupported port.");
  }
  return url;
}

async function assertPublicHost(url: URL) {
  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new JobImportError("That link can't be read.");
  }

  if (isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new JobImportError("That link can't be read.");
    return;
  }

  let addresses: { address: string }[];
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new JobImportError("That link could not be found.");
  }

  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new JobImportError("That link can't be read.");
  }
}


async function readLimitedBody(response: Response) {
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_HTML_BYTES) {
      await reader.cancel();
      throw new JobImportError("That job page is too large to read.");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

async function fetchJobPage(startUrl: URL) {
  let currentUrl = startUrl;

  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicHost(currentUrl);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    let response: Response;

    try {
      response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.8",
          "User-Agent": "PursuitBot/1.0 (+https://pursuit.enoch.et)",
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new JobImportError("That job page took too long to respond.");
      }
      throw new JobImportError("That job page could not be reached.");
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) {
        throw new JobImportError("That job page redirected too many times.");
      }
      currentUrl = parseUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      throw new JobImportError("That job page blocked automated reading. Enter the details manually.");
    }
    if (!response.ok) {
      throw new JobImportError("That job page is unavailable right now.");
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new JobImportError("That link does not point to a readable job page.");
    }

    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (contentLength > MAX_HTML_BYTES) {
      throw new JobImportError("That job page is too large to read.");
    }

    const html = await readLimitedBody(response);
    return { html, finalUrl: currentUrl.toString() };
  }

  throw new JobImportError("That job page redirected too many times.");
}

function attributeMap(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([a-zA-Z0-9:_-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = decodeEntities(match[3] ?? match[4] ?? match[5] ?? "");
  }
  return attributes;
}

function getMeta(html: string, keys: string[]) {
  const tags = [...html.matchAll(/<meta\b[^>]*>/gi)].map((match) => attributeMap(match[0]));
  for (const tag of tags) {
    const name = (tag.property || tag.name || "").toLowerCase();
    if (keys.some((key) => name === key.toLowerCase()) && tag.content) {
      return cleanText(tag.content);
    }
  }
  return "";
}

function getCanonical(html: string) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => attributeMap(match[0]));
  const canonical = links.find((link) => (link.rel || "").toLowerCase() === "canonical");
  return canonical?.href ?? "";
}

function getFirstTag(html: string, tag: string) {
  const match = html.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return cleanText(match?.[1]);
}

function collectStructuredNodes(value: unknown, nodes: Record<string, unknown>[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectStructuredNodes(item, nodes));
    return;
  }
  if (!value || typeof value !== "object") return;

  const object = value as Record<string, unknown>;
  const type = object["@type"];
  const types = Array.isArray(type) ? type : [type];
  if (types.some((entry) => String(entry).toLowerCase() === "jobposting")) {
    nodes.push(object);
  }

  for (const key of ["@graph", "mainEntity", "itemListElement", "item"]) {
    if (key in object) collectStructuredNodes(object[key], nodes);
  }
}

function findJobPosting(html: string) {
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const nodes: Record<string, unknown>[] = [];

  for (const block of blocks) {
    try {
      collectStructuredNodes(JSON.parse(block[1]), nodes);
    } catch {
      // Ignore invalid structured data and fall back to metadata.
    }
  }

  return nodes[0] ?? null;
}

function textValue(value: unknown) {
  return typeof value === "string" ? cleanText(value) : "";
}

function objectValue(value: unknown) {
  if (Array.isArray(value)) return value.find((item) => item && typeof item === "object") as Record<string, unknown> | undefined;
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function addressText(value: unknown) {
  const address = objectValue(value);
  if (!address) return "";
  const parts = [address.addressLocality, address.addressRegion, address.addressCountry]
    .map((part) => textValue(part))
    .filter(Boolean);
  return [...new Set(parts)].join(", ");
}

function locationFromPosting(posting: Record<string, unknown> | null) {
  if (!posting) return "";
  const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation];
  const values = locations
    .map((location) => {
      const object = objectValue(location);
      if (!object) return "";
      if (object["@type"] === "VirtualLocation") return "Remote";
      if (object.address) return addressText(object.address);
      return textValue(object.name);
    })
    .filter(Boolean);

  if (values.length) return [...new Set(values)].join(" / ");
  if (textValue(posting.jobLocationType).toLowerCase().includes("telecommute")) return "Remote";
  return "";
}

function atsCompany(url: URL) {
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  if (host.endsWith("greenhouse.io")) {
    if (segments[0] === "embed") {
      return titleCase(url.searchParams.get("for") ?? "");
    }
    return titleCase(segments[0] ?? "");
  }
  if (host.endsWith("lever.co") || host.endsWith("ashbyhq.com") || host.endsWith("workable.com")) {
    return titleCase(segments[0] ?? "");
  }
  if (host.endsWith("smartrecruiters.com")) {
    return titleCase(segments[0] ?? "");
  }
  return "";
}

function isAtsHost(hostname: string) {
  const host = hostname.replace(/^www\./, "").toLowerCase();
  return [
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "workable.com",
    "smartrecruiters.com",
    "linkedin.com",
    "indeed.com",
    "glassdoor.com",
  ].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

function companyFromTitle(value: string) {
  const parts = value.split(/\s+(?:at|@)\s+/i);
  if (parts.length < 2) return "";
  return cleanText(parts.slice(1).join(" ").split(/\s*[|\u00b7]\s*/)[0]);
}

function cleanRole(value: string, company: string) {
  let role = cleanText(value).split(/\s*[|\u00b7]\s*/)[0] ?? "";
  const at = role.split(/\s+(?:at|@)\s+/i);
  if (at.length > 1 && at[0]) role = at[0];
  if (company) {
    const escaped = company.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    role = role.replace(new RegExp(`\\s+[\\-\\u2013\\u2014]\\s+${escaped}$`, "i"), "");
  }
  return cleanText(role);
}

function companyWebsiteFromPosting(posting: Record<string, unknown> | null, finalUrl: URL) {
  const organization = objectValue(posting?.hiringOrganization);
  const sameAs = organization?.sameAs;
  const candidates = [organization?.url, ...(Array.isArray(sameAs) ? sameAs : [sameAs])];
  for (const candidate of candidates) {
    const value = textValue(candidate);
    if (!value) continue;
    try {
      const url = new URL(value);
      if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
    } catch {
      // Ignore malformed organization URLs.
    }
  }

  if (isAtsHost(finalUrl.hostname)) return "";
  const parts = finalUrl.hostname.replace(/^www\./, "").split(".");
  return parts.length >= 2 ? `https://${parts.slice(-2).join(".")}` : "";
}

function domainCompany(hostname: string) {
  if (isAtsHost(hostname)) return "";
  const parts = hostname.replace(/^www\./, "").split(".");
  return titleCase(parts.length >= 2 ? parts[parts.length - 2] : parts[0]);
}

function isGenericSiteName(value: string) {
  return /^(greenhouse|lever|ashby|workable|smartrecruiters|linkedin|indeed|glassdoor|jobs|careers|apply)$/i.test(
    value.trim(),
  );
}

export function parseJobPostingHtml(html: string, finalUrl: string): JobImportResult {
  const url = new URL(finalUrl);
  const posting = findJobPosting(html);
  const ogTitle = getMeta(html, ["og:title", "twitter:title"]);
  const pageTitle = getFirstTag(html, "title");
  const h1 = getFirstTag(html, "h1");
  const ogSiteName = getMeta(html, ["og:site_name", "application-name"]);
  const structuredTitle = textValue(posting?.title);
  const organization = objectValue(posting?.hiringOrganization);
  const structuredCompany = textValue(organization?.name);
  const atsName = atsCompany(url);
  const guessedCompany =
    structuredCompany ||
    atsName ||
    (ogSiteName && !isGenericSiteName(ogSiteName) ? ogSiteName : "") ||
    companyFromTitle(ogTitle || pageTitle) ||
    domainCompany(url.hostname);
  const position = cleanRole(structuredTitle || ogTitle || h1 || pageTitle, guessedCompany);
  const location = locationFromPosting(posting) || getMeta(html, ["job:location", "location"]);
  const companyWebsite = companyWebsiteFromPosting(posting, url);
  const canonical = getCanonical(html);
  let jobUrl = url.toString();
  if (canonical && /^https?:\/\//i.test(canonical)) {
    try {
      const canonicalUrl = new URL(canonical, url);
      if (canonicalUrl.protocol === "http:" && url.protocol === "https:") {
        canonicalUrl.protocol = "https:";
      }
      jobUrl = canonicalUrl.toString();
    } catch {
      // Keep the final fetched URL.
    }
  }

  const fields: JobImportFields = { jobUrl };
  if (guessedCompany) fields.companyName = guessedCompany;
  if (position) fields.position = position;
  if (location) fields.location = location;
  if (companyWebsite) fields.companyWebsite = companyWebsite;

  return { fields, source: url.hostname.replace(/^www\./, "") };
}

export async function extractJobPosting(rawUrl: string): Promise<JobImportResult> {
  const url = parseUrl(rawUrl);
  const { html, finalUrl } = await fetchJobPage(url);
  const result = parseJobPostingHtml(html, finalUrl);

  if (!result.fields.companyName && !result.fields.position) {
    throw new JobImportError("We couldn't find the company or role on that page. Enter them manually.");
  }

  return result;
}
