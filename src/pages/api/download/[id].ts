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

    const theme = await themesCollection.findOne({ id: Number(id) });

    if (!theme)
        return res.status(404).json({
            status: 404,
            message: `Couldn't find the theme with the id '${id}'`
        });

    themesCollection.updateOne({ id: Number(id) }, { $inc: { downloads: 1 } }, { upsert: true }).catch(console.error);

    const fileContent = Buffer.from(theme.content, "base64");

    res.setHeader("Content-Type", "text/css");
    res.setHeader("Content-Disposition", `attachment; filename="${theme.name}.theme.css"`);
    res.setHeader("Content-Length", fileContent.length);

    res.status(200).send(fileContent);
}
