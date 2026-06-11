import { NextRequest, NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-real-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        ""
    );
}

function logRequest(req: NextRequest) {
    const ts = new Date().toISOString();
    const ip = getClientIp(req);
    const { pathname, search } = req.nextUrl;
    const referer = req.headers.get("referer") ?? "-";
    const ua = req.headers.get("user-agent") ?? "-";
    console.log(`[${ts}] ${req.method} ${pathname}${search} - ip: ${ip || "unknown"} - referer: ${referer} | ua: ${ua}`);
}

export async function proxy(req: NextRequest) {
    if (isDev) logRequest(req);

    if (req.method === "OPTIONS") {
        return new NextResponse("", { status: 200 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/api/:path*"]
};
