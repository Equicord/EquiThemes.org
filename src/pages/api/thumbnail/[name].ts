"use cache";

import { SERVER } from "@constants";
import { ErrorHandler } from "@lib/errorHandler";
import type { NextApiRequest, NextApiResponse } from "next";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const { name } = req.query as { name: string };
    const decodedName = decodeURIComponent(name);

    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "public, max-age=1200");

    res.redirect(301, `${SERVER}/theme/${decodedName}`);
}

export default ErrorHandler(GET);