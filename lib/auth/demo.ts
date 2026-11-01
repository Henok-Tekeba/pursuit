export const DEMO_EMAIL = "elena@pursuit.app";
export const DEMO_PASSWORD = "REDACTED_DEMO_CREDENTIAL!";
export const DEMO_NAME = "Elena Crutiez";
export const DEMO_AVATAR = "/avatars/w44.jpg";

export function isDemoLoginEnabled() {
  return process.env.DEMO_LOGIN_ENABLED !== "false";
}
