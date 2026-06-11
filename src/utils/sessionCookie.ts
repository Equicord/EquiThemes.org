import type { NextApiResponse } from "next";

export const SESSION_COOKIE = "_dtoken";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function build(value: string, maxAge: number): string {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function setSessionCookie(res: NextApiResponse, token: string) {
    res.setHeader("Set-Cookie", build(token, MAX_AGE));
}

export function clearSessionCookie(res: NextApiResponse) {
    res.setHeader("Set-Cookie", build("", 0));
}
