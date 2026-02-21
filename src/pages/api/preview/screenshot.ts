"use cache";

import { NextApiRequest, NextApiResponse } from "next";
import { SERVER } from "@constants";
import { ErrorHandler } from "@lib/errorHandler";
export const dynamic = "force-dynamic";

const CHROMIUM_PATH = "https://vomrghiulbmrfvmhlflk.supabase.co/storage/v1/object/public/chromium-pack/chromium-v123.0.0-pack.tar";

let cachedBrowser: any = null;

const PUPPETEER_LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--disable-gpu"];

async function getBrowser() {
    if (cachedBrowser) return cachedBrowser;

    if (process.env.VERCEL_ENV === "production") {
        const { default: chromium } = await import("@sparticuz/chromium-min");
        const { default: puppeteerCore } = await import("puppeteer-core");

        const executablePath = await chromium.executablePath(CHROMIUM_PATH);

        cachedBrowser = await puppeteerCore.launch({
            args: [...chromium.args, ...PUPPETEER_LAUNCH_ARGS],
            defaultViewport: chromium.defaultViewport,
            executablePath,
            headless: chromium.headless
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

    let browser: any;
    let page: any;

    try {
        browser = await getBrowser();
        page = await browser.newPage();

        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36");
        await page.setCookie({
            name: "consent",
            value: "true",
            domain: ".fafakitty.workers.dev",
            path: "/"
        });

        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto(`https://worker-name.thororen1234.workers.dev/?css=${encodeURIComponent(url)}`, {
            waitUntil: "networkidle0",
            timeout: 30000
        });

        await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 21500)));

        const screenshot = await page.screenshot({ type: "png" });

        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(Buffer.from(screenshot, "base64"));
    } catch (error) {
        console.error("Error taking screenshot:", error);
        return res.status(500).json({ message: "Internal server error" });
    } finally {
        if (page) await page.close();
    }
}

export default ErrorHandler(GET);