import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ObjectId } from "mongodb";

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

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

    const { markAllAsRead } = req.body;

    if (!markAllAsRead) {
        return res.status(400).json({
            status: 400,
            message: "Invalid Request - markAllAsRead is required"
        });
    }

    try {
        const client = await clientPromise;
        const submittedDb = client.db("themesDatabase");
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
