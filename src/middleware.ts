import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isDev = process.env.NODE_ENV === "development";

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        ""
    );
}

function logRequest(req: NextRequest, ip: string) {
    const ts = new Date().toISOString();
    const { method } = req;
    const { pathname, search } = req.nextUrl;
    const referer = req.headers.get("referer") ?? "-";
    const ua = req.headers.get("user-agent") ?? "-";
    console.log(`[${ts}] ${method} ${pathname}${search} - ip: ${ip || "unknown"} - referer: ${referer} | ua: ${ua}`);
}

export async function middleware(req: NextRequest) {
    if (isDev) logRequest(req, getClientIp(req));

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
