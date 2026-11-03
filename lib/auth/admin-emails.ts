function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const configured = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");
  const normalized = normalizeEmail(email);
  return configured
    .split(/[,\s;]+/)
    .map((value) => normalizeEmail(value))
    .filter(Boolean)
    .includes(normalized);
}
