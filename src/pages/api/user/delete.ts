import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@utils/db";
import { Collection } from "mongodb";
import { type Theme } from "@types";
import { ErrorHandler } from "@lib/errorHandler";
const WEBHOOK_LOGS_URL = process.env.WEBHOOK_LOGS;

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed", wants: "DELETE" });
    }

    const { userId } = req.body;
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(400).json({ message: "Cannot check authorization without unique token" });
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
        return res.status(400).json({ message: "Cannot revoke authorization without unique token" });
    }

    if (!userId) {
        return res.status(400).json({ message: "Cannot revoke authorization without user id" });
    }

    const client = await clientPromise;
    const db = client.db("themesDatabase");
    const users = db.collection("users");

    const themes: Collection<Theme> = db.collection("themes");

    const requester = await users.findOne({ "user.key": token });

    if (!requester) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    if (requester.user.id !== userId && !requester.user.admin) {
        return res.status(403).json({ message: "Unauthorized - Insufficient permissions" });
    }

    const user = await users.findOne({ "user.id": userId });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.user.admin) {
        return res.status(403).json({ message: "Cannot delete admin user" });
    }

    const userThemes = await themes
        .find({
            $or: [{ "author.discord_snowflake": userId }, { author: { $elemMatch: { discord_snowflake: userId } } }]
        })
        .toArray();

    try {
        for (const theme of userThemes) {
            if (Array.isArray(theme.author)) {
                if (theme.author.length === 1) {
                    await themes.deleteOne({ id: theme.id });
                } else {
                    // @ts-ignore
                    await themes.updateOne({ id: theme.id }, { $pull: { author: { discord_snowflake: userId } } });
                }
            } else {
                await themes.deleteOne({ id: theme.id });
            }
        }

        await users.deleteOne({ "user.id": userId });

        await fetch(WEBHOOK_LOGS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                embeds: [
                    {
                        title: "Deleted User",
                        color: 0xff0000,
                        fields: [
                            {
                                name: "User",
                                value: user.user.global_name
                            },
                            {
                                name: "User ID",
                                value: userId
                            },
                            {
                                name: "Themes Deleted",
                                value: userThemes.length
                            },
                            {
                                name: "Themes Remaining",
                                value: await themes.countDocuments()
                            }
                        ]
                    }
                ]
            })
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }

    return res.status(200).json({
        status: 200,
        authorized: false
    });
}

export default ErrorHandler(DELETE);