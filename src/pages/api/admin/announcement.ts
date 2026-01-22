import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";

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

    if (!user.admin) {
        return res.status(403).json({ status: 403, message: "Unauthorized - Admin access required" });
    }

    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(400).json({
            status: 400,
            message: "Invalid Request - Missing required fields",
            fields: ["title", "message"]
        });
    }

    try {
        const client = await clientPromise;
        
        
        const themesDb = client.db("themesDatabase");
        const usersCollection = themesDb.collection("users");
        
        const allUsers = await usersCollection.find({}).project({ "user.id": 1 }).toArray();
        
        if (allUsers.length === 0) {
            return res.status(200).json({
                status: 200,
                message: "No users found to notify"
            });
        }

        
        const submittedDb = client.db("themesDatabase");
        const notificationsCollection = submittedDb.collection("notifications");

        const notifications = allUsers.map((userDoc) => ({
            userId: userDoc.user.id,
            type: "announcement",
            message: title,
            reason: message,
            createdAt: new Date().toISOString(),
            read: false
        }));

        const result = await notificationsCollection.insertMany(notifications);

        const insertedCount = Object.keys(result.insertedIds).length;

        return res.status(200).json({
            status: 200,
            message: `Announcement sent to ${insertedCount} users`,
            count: insertedCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error"
        });
    }
}
