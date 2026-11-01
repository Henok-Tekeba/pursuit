import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import type { JWTPayload } from "jose";

export const SESSION_COOKIE = "it_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  const configured = process.env.SESSION_SECRET;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is required in production. Generate one with: openssl rand -base64 32",
    );
  }
  const secret = configured ?? "REDACTED_DEV_SESSION_FALLBACK";
  return new TextEncoder().encode(secret);
}

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
};

export async function createSessionToken(userId: string, email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
