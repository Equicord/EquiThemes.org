import { NextRequest, NextResponse } from "next/server";

const rateLimit = new Map<string, { count: number; lastRequest: number; hits: number }>();

const RATE_LIMIT_WINDOW = 3500;
const RATE_LIMIT_MAX_REQUESTS = 10;
const SCREENSHOT_RATE_LIMIT_WINDOW = 15000;
const SCREENSHOT_RATE_LIMIT_MAX_REQUESTS = 2;

const EXCLUDED_FROM_RATE_LIMIT = ["/api/user/isAuthed", "/api/user/themes"];

export async function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const path = url.pathname;
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    if (req.method === "OPTIONS") {
        return new NextResponse("", { status: 200 });
    }

    if (path.startsWith("/api") && !EXCLUDED_FROM_RATE_LIMIT.includes(path)) {
        const now = Date.now();

        if (path === "/api/preview/screenshot") {
            if (!rateLimit.has(ip)) {
                rateLimit.set(ip, { count: 1, lastRequest: now, hits: 0 });
            } else {
                const rateInfo = rateLimit.get(ip)!;

                if (now - rateInfo.lastRequest < SCREENSHOT_RATE_LIMIT_WINDOW) {
                    rateInfo.count += 1;
                    if (rateInfo.count > SCREENSHOT_RATE_LIMIT_MAX_REQUESTS) {
                        const retryAfter = Math.ceil((SCREENSHOT_RATE_LIMIT_WINDOW - (now - rateInfo.lastRequest)) / 1000);
                        return new NextResponse(JSON.stringify({ message: "Too many requests" }), {
                            status: 429,
                            headers: {
                                "Content-Type": "application/json",
                                "Retry-After": retryAfter.toString()
                            }
                        });
                    }
                } else {
                    rateInfo.count = 1;
                    rateInfo.lastRequest = now;
                }
            }
        } else {
            if (!rateLimit.has(ip)) {
                rateLimit.set(ip, { count: 1, lastRequest: now, hits: 0 });
            } else {
                const rateInfo = rateLimit.get(ip)!;

                if (now - rateInfo.lastRequest < RATE_LIMIT_WINDOW) {
                    rateInfo.count += 1;
                    if (rateInfo.count > RATE_LIMIT_MAX_REQUESTS) {
                        rateInfo.hits += 1;
                        const retryAfter = Math.ceil(RATE_LIMIT_WINDOW - (now - rateInfo.lastRequest));
                        return new NextResponse(JSON.stringify({ message: "Too many requests" }), {
                            status: 429,
                            headers: {
                                "Content-Type": "application/json",
                                "Retry-After": retryAfter.toString()
                            }
                        });
                    }
                } else {
                    rateInfo.count = 1;
                    rateInfo.lastRequest = now;
                }
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"]
};
