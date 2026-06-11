import { NextRequest, NextResponse } from "next/server";

const logRequests = process.env.LOG_REQUESTS === "true";
const logFilter = process.env.LOG_FILTER ?? null;

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        ""
    );
}

function shouldLog(ua: string, referer: string): boolean {
    if (!logFilter) return true;
    return ua.toLowerCase().includes(logFilter.toLowerCase()) || referer.toLowerCase().includes(logFilter.toLowerCase());
}

function logRequest(req: NextRequest) {
    const ua = req.headers.get("user-agent") ?? "-";
    const referer = req.headers.get("referer") ?? "-";

    if (!shouldLog(ua, referer)) return;

    const ts = new Date().toISOString();
    const ip = getClientIp(req);
    const { pathname, search } = req.nextUrl;
    console.log(`[${ts}] ${req.method} ${pathname}${search} - ip: ${ip || "unknown"} - referer: ${referer} | ua: ${ua}`);
}

export async function proxy(req: NextRequest) {
    if (logRequests) logRequest(req);

    if (req.method === "OPTIONS") {
        return new NextResponse("", { status: 200 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
