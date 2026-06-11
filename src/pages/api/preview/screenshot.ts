"use cache";

import { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler } from "@lib/errorHandler";
import type { Browser, Page, Viewport } from "puppeteer-core";
export const dynamic = "force-dynamic";

const CHROMIUM_PATH = process.env.CHROMIUM_PACK_URL || "https://vomrghiulbmrfvmhlflk.supabase.co/storage/v1/object/public/chromium-pack/chromium-v123.0.0-pack.tar";
const PREVIEW_WORKER_URL = process.env.PREVIEW_WORKER_URL || "https://worker-name.thororen1234.workers.dev";

let cachedBrowser: Browser | null = null;

const PUPPETEER_LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu"];

async function getBrowser(): Promise<Browser> {
    if (cachedBrowser) return cachedBrowser;

    if (process.env.VERCEL_ENV === "production") {
        const { default: chromium } = await import("@sparticuz/chromium-min");
        const { default: puppeteerCore } = await import("puppeteer-core");

        const executablePath = await chromium.executablePath(CHROMIUM_PATH);

        // Current @sparticuz/chromium-min no longer declares (or provides)
        // `defaultViewport`/`headless`; they resolve to `undefined` at runtime
        // and puppeteer then falls back to its own defaults.
        const legacyChromium = chromium as unknown as {
            defaultViewport?: Viewport | null;
            headless?: boolean | "shell";
        };

        cachedBrowser = await puppeteerCore.launch({
            args: [...chromium.args, ...PUPPETEER_LAUNCH_ARGS],
            defaultViewport: legacyChromium.defaultViewport,
            executablePath,
            headless: legacyChromium.headless
        });
    } else {
        const { default: puppeteer } = await import("puppeteer");
        cachedBrowser = await puppeteer.launch({
            args: PUPPETEER_LAUNCH_ARGS,
            headless: true,
        });
    }

    return cachedBrowser;
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
        return res.status(400).json({ message: "Missing or invalid URL query parameter" });
    }

    let browser: Browser | undefined;
    let page: Page | undefined;

    try {
        browser = await getBrowser();
        page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
        await page.setCookie({
            name: "consent",
            value: "true",
            domain: `.${new URL(PREVIEW_WORKER_URL).hostname}`,
            path: "/"
        });

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(`${PREVIEW_WORKER_URL}/?css=${encodeURIComponent(url)}`, {
            waitUntil: "networkidle0",
            timeout: 30000
        });

        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 21500)));

        const screenshot = await page.screenshot({ type: "png" });

        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(Buffer.from(screenshot));
    } catch (error) {
        console.error("Error taking screenshot:", error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (page) await page.close();
    }
}

export default ErrorHandler(GET);