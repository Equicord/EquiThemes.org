import clientPromise, { THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const themeId = Number(req.body.themeId);
    if (!Number.isInteger(themeId)) {
        return res.status(400).json({ status: 400, message: "Invalid themeId" });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const user = await isAuthed(token);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const client = await clientPromise;
    const db = client.db(THEMES_DB);
    const themesCollection = db.collection("themes");
    const likesCollection = db.collection("likes");

    try {
        const themeExists = await db.collection("themes").findOne({ id: themeId });
        if (!themeExists) {
            return res.status(404).json({ status: 404, message: "Theme does not exist. Please ensure the theme id is correct and try again" });
        }

        const themeLike = await likesCollection.findOne({ themeId });

        if (themeLike) {
            if (!themeLike.userIds.includes(user.id)) {
                return res.status(409).json({ status: 409, message: `User has not liked this theme matching '${themeId}'` });
            }

            // @ts-ignore
            await likesCollection.updateOne({ themeId }, { $pull: { userIds: user.id } });

            const updatedThemeLike = await likesCollection.findOne({ themeId });
            if (updatedThemeLike && updatedThemeLike.userIds.length === 0) {
                await likesCollection.deleteOne({ themeId });
            }
        } else {
            return res.status(409).json({ status: 409, message: `User has not liked this theme matching '${themeId}'` });
        }

        await themesCollection.updateOne({ id: themeId }, { $inc: { likes: -1 } });

        res.status(200).json({ status: 200 });
    } catch (error) {
        res.status(500).json({ status: 500, message: `Failed to register likes of theme '${themeId}' with reason: ${error}` });
    }
}

export default ErrorHandler(POST);