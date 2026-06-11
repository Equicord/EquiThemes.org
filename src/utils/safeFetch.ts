import { lookup as dnsLookup } from "dns/promises";
import { isIP } from "net";
import http from "http";
import https from "https";

function isPrivateIp(ip: string): boolean {
    if (ip.includes(":")) {
        const v6 = ip.toLowerCase();
        if (v6.startsWith("::ffff:")) return isPrivateIp(v6.replace("::ffff:", ""));
        return (
            v6 === "::1" ||
            v6 === "::" ||
            v6.startsWith("fe80") ||
            v6.startsWith("fc") ||
            v6.startsWith("fd")
        );
    }

    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p))) return true;
    const [a, b] = parts;

    return (
        a === 0 ||
        a === 10 ||
        a === 127 ||
        (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && b === 168) ||
        (a === 100 && b >= 64 && b <= 127) ||
        a >= 224
    );
}

interface LookupAddress {
    address: string;
    family: number;
}

interface ValidatedTarget {
    url: URL;
    addresses: LookupAddress[];
}

async function resolveAndValidate(rawUrl: string): Promise<ValidatedTarget> {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new Error("Invalid URL");
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Only http(s) URLs are allowed");
    }

    const host = url.hostname;

    if (isIP(host)) {
        if (isPrivateIp(host)) throw new Error("URL resolves to a disallowed address");
        return { url, addresses: [{ address: host, family: isIP(host) }] };
    }

    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
        throw new Error("URL resolves to a disallowed address");
    }

    const resolved = await dnsLookup(host, { all: true });
    if (!resolved.length || resolved.some(r => isPrivateIp(r.address))) {
        throw new Error("URL resolves to a disallowed address");
    }

    return { url, addresses: resolved.map(r => ({ address: r.address, family: r.family })) };
}

export async function assertPublicUrl(rawUrl: string): Promise<URL> {
    return (await resolveAndValidate(rawUrl)).url;
}

export interface SafeResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string | string[] | undefined>;
    body: Buffer;
    text: () => string;
}

export async function safeFetch(rawUrl: string, init?: { headers?: Record<string, string>; maxBytes?: number }): Promise<SafeResponse> {
    const { url, addresses } = await resolveAndValidate(rawUrl);
    const maxBytes = init?.maxBytes ?? 5_000_000;
    const transport = url.protocol === "https:" ? https : http;

    return new Promise<SafeResponse>((resolve, reject) => {
        const req = transport.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                servername: url.hostname,
                port: url.port || (url.protocol === "https:" ? 443 : 80),
                path: `${url.pathname}${url.search}`,
                method: "GET",
                headers: { Host: url.host, ...(init?.headers ?? {}) },
                lookup: (_hostname: string, opts: unknown, cb: unknown) => {
                    const callback = (typeof opts === "function" ? opts : cb) as (err: NodeJS.ErrnoException | null, addresses: LookupAddress[]) => void;
                    callback(null, addresses);
                }
            },
            res => {
                const status = res.statusCode ?? 0;
                if (status >= 300 && status < 400) {
                    res.destroy();
                    reject(new Error("Redirects are not allowed"));
                    return;
                }

                const chunks: Buffer[] = [];
                let total = 0;
                res.on("data", (chunk: Buffer) => {
                    total += chunk.length;
                    if (total > maxBytes) {
                        res.destroy();
                        reject(new Error("Response too large"));
                        return;
                    }
                    chunks.push(chunk);
                });
                res.on("end", () => {
                    const body = Buffer.concat(chunks);
                    resolve({
                        ok: status >= 200 && status < 300,
                        status,
                        statusText: res.statusMessage ?? "",
                        headers: res.headers,
                        body,
                        text: () => body.toString("utf-8")
                    });
                });
                res.on("error", reject);
            }
        );

        req.on("error", reject);
        req.setTimeout(15000, () => req.destroy(new Error("Request timed out")));
        req.end();
    });
}
