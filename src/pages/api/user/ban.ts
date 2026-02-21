import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { authorization } = req.headers;
    const { userId, action, reason } = req.body;

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
        return res.status(403).json({ status: 403, message: "Unauthorized" });
    }

    if (!userId || !action) {
        return res.status(400).json({
            status: 400,
            message: "Invalid Request - Missing required fields",
            fields: ["userId", "action"]
        });
    }

    if (action !== "ban" && action !== "unban") {
        return res.status(400).json({
            status: 400,
            message: "Invalid action. Must be 'ban' or 'unban'"
        });
    }

    try {
        const client = await clientPromise;
        const usersDb = client.db("themesDatabase");
        const usersCollection = usersDb.collection("users");
        const notificationsCollection = usersDb.collection("notifications");

        if (action === "ban") {
            await usersCollection.updateOne(
                { "user.id": userId },
                {
                    $set: {
                        "user.bannedFromSubmissions": true,
                        "user.banReason": reason || "Banned by moderator",
                        "user.bannedAt": new Date(),
                        "user.bannedBy": {
                            discord_snowflake: user.id,
                            discord_name: user.global_name || "",
                            avatar_url: user.avatar || ""
                        }
                    }
                }
            );

            // Create a notification for the banned user
            await notificationsCollection.insertOne({
                userId: userId,
                type: "user_banned",
                message: "Your account has been banned from submitting themes",
                reason: reason || "Banned by moderator",
                createdAt: new Date().toISOString(),
                read: false
            });
        } else if (action === "unban") {
            await usersCollection.updateOne(
                { "user.id": userId },
                {
                    $set: {
                        "user.bannedFromSubmissions": false
                    },
                    $unset: {
                        "user.banReason": "",
                        "user.bannedAt": "",
                        "user.bannedBy": ""
                    }
                }
            );

            // Create a notification for the unbanned user
            await notificationsCollection.insertOne({
                userId: userId,
                type: "user_unbanned",
                message: "Your submission ban has been lifted",
                createdAt: new Date().toISOString(),
                read: false
            });
        }

        return res.status(200).json({
            status: 200,
            message: `User ${action === "ban" ? "banned" : "unbanned"} successfully`,
            action
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