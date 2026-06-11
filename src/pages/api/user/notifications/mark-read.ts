import clientPromise, { THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const user = await isAuthed(token as string);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const { markAllAsRead } = req.body;

    if (!markAllAsRead) {
        return res.status(400).json({
            status: 400,
            message: "Invalid Request - markAllAsRead is required"
        });
    }

    try {
        const client = await clientPromise;
        const submittedDb = client.db(THEMES_DB);
        const notificationsCollection = submittedDb.collection("notifications");

        const result = await notificationsCollection.updateMany(
            { userId: user.id, read: false },
            { $set: { read: true } }
        );

        return res.status(200).json({
            status: 200,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error"
        });
    }
}

export default ErrorHandler(POST);