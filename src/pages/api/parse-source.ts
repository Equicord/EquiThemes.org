import type { NextApiRequest, NextApiResponse } from "next";
import { parseSourceUrl } from "@utils/sourceParser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            status: 400,
            message: "URL is required"
        });
    }

    try {
        const content = await parseSourceUrl(url);
        
        
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        
        return res.status(200).json({
            status: 200,
            content
        });
    } catch (error: any) {
        return res.status(400).json({
            status: 400,
            message: error.message || "Failed to parse source URL"
        });
    }
}
