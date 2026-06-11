import clientPromise, { THEMES_DB } from "@utils/db";
import { getToken, isAuthed } from "@utils/auth";
import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler } from "@lib/errorHandler";
import type { LikeEntry, LikesData } from "@types";

/** Raw document shape of the `likes` collection in MongoDB. */
interface LikeDocument {
    themeId: number;
    userIds: string[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }
    const client = await clientPromise;
    const db = client.db(THEMES_DB);
    const likesCollection = db.collection("likes");

    try {
        const likes = (await likesCollection.find({}).toArray()) as unknown as LikeDocument[];

        const token = getToken(req);

        if (token) {
            const user = await isAuthed(token as string);
            if (user) {
                const userLikes: LikeEntry[] = likes.map((like) => ({
                    themeId: like.themeId,
                    likes: like.userIds.length,
                    hasLiked: like.userIds.includes(user.id)
                }));
                const response: LikesData = {
                    status: 200,
                    likes: userLikes
                };
                return res.status(200).json(response);
            }
        }

        const themes: LikeEntry[] = likes.map((like) => ({
            themeId: like.themeId,
            likes: like.userIds.length
        }));

        const response: LikesData = {
            status: 200,
            likes: themes
        };
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: error instanceof Error ? error.message : "Internal server error"
        });
    }
}

export default ErrorHandler(handler);