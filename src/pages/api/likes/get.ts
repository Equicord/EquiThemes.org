import clientPromise from "@utils/db";
import { isAuthed } from "@utils/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler } from "@lib/errorHandler";

interface LikeEntry {
    themeId: number;
    userIds: string[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }
    const client = await clientPromise;
    const db = client.db("themesDatabase");
    const likesCollection = db.collection("likes");

    try {
        const likes = (await likesCollection.find({}).toArray()) as unknown as LikeEntry[];

        const { authorization } = req.headers;
        const token = authorization?.replace("Bearer ", "")?.trim() ?? null;

        if (token) {
            const user = await isAuthed(token as string);
            if (user) {
                const userLikes = likes.map((like: LikeEntry) => ({
                    themeId: like.themeId,
                    likes: like.userIds.length,
                    hasLiked: like.userIds.includes(user.id)
                }));
                return res.status(200).json({
                    status: 200,
                    likes: userLikes
                });
            }
        }

        const themes = likes.map((like: LikeEntry) => ({
            themeId: like.themeId,
            likes: like.userIds.length
        }));

        return res.status(200).json({
            status: 200,
            likes: themes
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error.message
        });
    }
}

export default ErrorHandler(handler);