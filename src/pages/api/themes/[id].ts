import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(400).json({ message: "Cannot check authorization without unique token" });
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
        return res.status(400).json({ status: 400, message: "Invalid Request, unique user token is missing" });
    }

    const user = await isAuthed(token as string);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    try {
        const client = await clientPromise;
        const themesDb = client.db("themesDatabase");
        const themesCollection = themesDb.collection("themes");

        const theme = await themesCollection.findOne({ id: Number(id as string) });

        if (!theme) {
            return res.status(404).json({
                status: 404,
                message: "Theme not found"
            });
        }

        
        const userIdStr = user.id.toString();
        const authorIdStr = theme.author?.discord_snowflake?.toString();

        if (authorIdStr !== userIdStr && !user.admin) {
            return res.status(403).json({
                status: 403,
                message: "You do not have permission to modify this theme"
            });
        }

        
        if (req.method === "PUT") {
            const { name, description, version, content, sourceLink, tags } = req.body;

            
            if (!name || !description || !sourceLink) {
                return res.status(400).json({
                    status: 400,
                    message: "Missing required fields",
                    required: ["name", "description", "sourceLink"]
                });
            }

            
            const updateData: any = {
                name,
                description,
                source: sourceLink, 
                tags: tags || []
            };

            
            if (version) {
                updateData.version = version;
            }

            
            if (content) {
                updateData.content = Buffer.from(content).toString("base64");
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
    } catch (error: any) {
        console.error("Error processing theme request:", error);
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
            error: error.message
        });
    }
}

export default ErrorHandler(handler);