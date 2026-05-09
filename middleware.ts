import { NextRequest, NextResponse } from "next/server";

type Bucket = {
  hits: number[];
  lastSeen: number;
};

type LimitConfig = {
  windowMs: number;
  max: number;
};

const DEFAULT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const DEFAULT_PAGE_MAX = Number(process.env.RATE_LIMIT_PAGE_MAX || 120);
const DEFAULT_API_MAX = Number(process.env.RATE_LIMIT_API_MAX || 60);
const SENSITIVE_API_MAX = Number(process.env.RATE_LIMIT_SENSITIVE_API_MAX || 20);
const REGISTRATION_API_MAX = Number(process.env.RATE_LIMIT_REGISTRATION_API_MAX || 8);
const REGISTRATION_WINDOW_MS = Number(process.env.RATE_LIMIT_REGISTRATION_WINDOW_MS || 10 * 60_000);

const buckets = new Map<string, Bucket>();
let requestCount = 0;
const SWEEP_EVERY = 250;
const MAX_BUCKETS = Number(process.env.RATE_LIMIT_MAX_BUCKETS || 10_000);
const BUCKET_TTL_MS = Number(process.env.RATE_LIMIT_BUCKET_TTL_MS || 5 * 60_000);

function getClientIp(req: NextRequest) {
  const headerValue =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for") ||
    "";

  const ipFromHeader = headerValue.split(",")[0]?.trim();
  if (ipFromHeader) return ipFromHeader;

  return req.ip || "unknown";
}

function getLimitConfig(pathname: string): LimitConfig | null {
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return null;
  }

  if (pathname.startsWith("/api/")) {
    const sensitivePaths = [
      "/api/register",
      "/api/wait-list",
      "/api/lead-resource",
      "/api/mentor-requests",
      "/api/upload",
      "/api/admin-auth",
      "/api/cleanup",
      "/api/seed",
      "/api/seed-admin",
    ];

    const isSensitive = sensitivePaths.some((prefix) =>
      pathname.startsWith(prefix),
    );

    if (pathname.startsWith("/api/register") || pathname.startsWith("/api/wait-list")) {
      return {
        windowMs: REGISTRATION_WINDOW_MS,
        max: REGISTRATION_API_MAX,
      };
    }

    return {
      windowMs: DEFAULT_WINDOW_MS,
      max: isSensitive ? SENSITIVE_API_MAX : DEFAULT_API_MAX,
    };
  }

  return {
    windowMs: DEFAULT_WINDOW_MS,
    max: DEFAULT_PAGE_MAX,
  };
}

function buildRateLimitResponse(retryAfterSeconds: number) {
  return new NextResponse("Too Many Requests", {
    status: 429,
    headers: {
      "Retry-After": String(Math.max(1, retryAfterSeconds)),
      "Cache-Control": "no-store",
    },
  });
}

function sweepBuckets(now: number) {
  buckets.forEach((bucket, key) => {
    if (now - bucket.lastSeen > BUCKET_TTL_MS) {
      buckets.delete(key);
    }
  });

  while (buckets.size > MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const limit = getLimitConfig(pathname);

  if (!limit) {
    return NextResponse.next();
  }

  const ip = getClientIp(req);
  const bucketKey = `${ip}:${pathname.startsWith("/api/") ? "api" : "page"}`;
  const now = Date.now();

  requestCount += 1;
  if (requestCount % SWEEP_EVERY === 0) {
    sweepBuckets(now);
  }

  const existing = buckets.get(bucketKey) ?? { hits: [], lastSeen: now };
  const freshHits = existing.hits.filter((timestamp) => now - timestamp < limit.windowMs);
  freshHits.push(now);
  buckets.set(bucketKey, { hits: freshHits, lastSeen: now });

  const remaining = limit.max - freshHits.length;
  const retryAfterSeconds = Math.ceil(limit.windowMs / 1000);

  if (freshHits.length > limit.max) {
    return buildRateLimitResponse(retryAfterSeconds);
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit.max));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  response.headers.set("X-RateLimit-Reset", String(now + limit.windowMs));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
