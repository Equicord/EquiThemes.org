import clientPromise, { THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";
import type { Theme } from "@types";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const user = await isAuthed(token as string);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    try {
        const client = await clientPromise;
        const themesDb = client.db(THEMES_DB);
        const themesCollection = themesDb.collection("themes");

        const theme = await themesCollection.findOne({ id: Number(id as string) });

        if (!theme) {
            return res.status(404).json({
                status: 404,
                message: "Theme not found"
            });
        }


        const userIdStr = user.id.toString();
        const authors = Array.isArray(theme.author) ? theme.author : [theme.author];
        const isAuthor = authors.some((a) => a?.discord_snowflake?.toString() === userIdStr);

        if (!isAuthor && !user.admin) {
            return res.status(403).json({
                status: 403,
                message: "You do not have permission to modify this theme"
            });
        }

        
        if (req.method === "PUT") {
            const { name, description, version, content, sourceLink, tags, last_updated } = req.body;

            
            if (!name || !description || !sourceLink) {
                return res.status(400).json({
                    status: 400,
                    message: "Missing required fields",
                    required: ["name", "description", "sourceLink"]
                });
            }

            
            const updateData: Partial<Theme> = {
                name,
                description,
                source: sourceLink,
                ...(tags !== undefined && { tags })
            };


            if (version) {
                updateData.version = version;
            }


            if (content) {
                updateData.content = Buffer.from(content).toString("base64");
            }


            if (last_updated !== undefined) {
                if (typeof last_updated !== "string" || Number.isNaN(Date.parse(last_updated))) {
                    return res.status(400).json({
                        status: 400,
                        message: "Invalid last_updated, expected a parseable date string"
                    });
                }
                updateData.last_updated = last_updated;
            }

            
            const result = await themesCollection.updateOne(
                { id: Number(id as string) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                return res.status(404).json({
                    status: 404,
                    message: "Theme not found"
                });
            }

            
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            return res.status(200).json({
                status: 200,
                message: "Theme updated successfully",
                theme: updateData
            });
        }

        
        if (req.method === "DELETE") {
            const result = await themesCollection.deleteOne({ id: Number(id as string) });

            if (result.deletedCount === 0) {
                return res.status(404).json({
                    status: 404,
                    message: "Theme not found"
                });
            }

            return res.status(200).json({
                status: 200,
                message: "Theme deleted successfully"
            });
        }

        
        if (req.method === "GET") {
            delete theme._id;
            return res.status(200).json(theme);
        }

        return res.status(405).json({ message: "Method not allowed" });
    } catch (error) {
        console.error("Error processing theme request:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

export default ErrorHandler(handler);