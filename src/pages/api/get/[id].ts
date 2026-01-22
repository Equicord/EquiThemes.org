"use cache";

import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const { id } = req.query;

    const client = await clientPromise;
    const db = client.db("themesDatabase");
    const themesCollection = db.collection("themes");

    const __theme__ = await themesCollection.findOne({ id: Number(id) });
    if (!__theme__) return res.status(404).json({ status: 404, message: `Couldn't find the theme with the id '${id}'` });

    delete __theme__._id;

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "public, max-age=1200");
    res.status(200).json(__theme__);
}
