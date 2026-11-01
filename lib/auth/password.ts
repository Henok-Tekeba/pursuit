import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) return false;
  const [scheme, salt, encoded] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !encoded) return false;
  try {
    const expected = Buffer.from(encoded, "hex");
    if (expected.length !== KEY_LENGTH) return false;
    const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}
