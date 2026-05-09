import { webcrypto } from "crypto";

type JwkSet = {
  keys: FirebaseJwk[];
  fetchedAt: number;
};

type FirebaseJwk = JsonWebKey & {
  kid?: string;
};

type VerifiedAppCheck = {
  appId: string;
  claims: Record<string, unknown>;
};

const JWKS_URL = "https://firebaseappcheck.googleapis.com/v1/jwks";
const JWKS_TTL_MS = 6 * 60 * 60 * 1000;

let jwkCache: JwkSet | null = null;

function getProjectNumber() {
  return process.env.FIREBASE_APP_CHECK_PROJECT_NUMBER || "";
}

export function isAppCheckEnforced() {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY &&
      getProjectNumber(),
  );
}

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = Buffer.from(padded, "base64");
  return new Uint8Array(binary);
}

function decodePart(part: string) {
  const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

async function getJwks() {
  const now = Date.now();
  if (jwkCache && now - jwkCache.fetchedAt < JWKS_TTL_MS) {
    return jwkCache.keys;
  }

  const res = await fetch(JWKS_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Unable to fetch Firebase App Check public keys");
  }

  const data = await res.json();
  const keys = Array.isArray(data?.keys) ? data.keys : [];
  jwkCache = { keys, fetchedAt: now };
  return keys;
}

export async function verifyAppCheckToken(token: string | null | undefined): Promise<VerifiedAppCheck | null> {
  if (!token) return null;

  const projectNumber = getProjectNumber();
  if (!projectNumber) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;

  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;

  try {
    header = decodePart(headerPart);
    payload = decodePart(payloadPart);
  } catch {
    return null;
  }

  if (header.alg !== "RS256" || header.typ !== "JWT" || typeof header.kid !== "string") {
    return null;
  }

  const jwks = await getJwks();
  const jwk = jwks.find((key: FirebaseJwk) => key.kid === header.kid);
  if (!jwk) return null;

  const cryptoImpl = globalThis.crypto || webcrypto;
  const key = await cryptoImpl.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signedData = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const signature = base64UrlToBytes(signaturePart);
  const valid = await cryptoImpl.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signature,
    signedData,
  );

  if (!valid) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = Number(payload.exp || 0);
  const nbf = Number(payload.nbf || 0);
  const iss = payload.iss;
  const aud = payload.aud;
  const expectedIssuer = `https://firebaseappcheck.googleapis.com/${projectNumber}`;
  const expectedAudience = `projects/${projectNumber}`;

  if (typeof iss !== "string" || iss !== expectedIssuer) return null;
  if (Number.isFinite(exp) && exp > 0 && exp < nowSeconds) return null;
  if (Number.isFinite(nbf) && nbf > 0 && nbf > nowSeconds) return null;

  const audiences = Array.isArray(aud) ? aud : typeof aud === "string" ? [aud] : [];
  if (!audiences.some((item) => typeof item === "string" && item.includes(expectedAudience))) {
    return null;
  }

  const appId = typeof payload.sub === "string" ? payload.sub : "";
  return { appId, claims: payload };
}

export async function requireAppCheck(req: Request) {
  if (!isAppCheckEnforced()) {
    return null;
  }

  try {
    const headerToken = req.headers.get("X-Firebase-AppCheck");
    return await verifyAppCheckToken(headerToken);
  } catch {
    return null;
  }
}
