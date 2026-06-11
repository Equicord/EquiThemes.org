import { ErrorHandler } from "@lib/errorHandler";
import clientPromise, { THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const client = await clientPromise;
    const db = client.db(THEMES_DB);
    const themesCollection = db.collection("themes");

    const includeContent = req.query.content !== "false";
    const projection: Record<string, 0 | 1> = { _id: 0 };
    if (!includeContent) {
        projection.content = 0;
    }

    const themes = await themesCollection.find({}, { projection }).toArray();

    
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(themes);
}

export default ErrorHandler(GET);