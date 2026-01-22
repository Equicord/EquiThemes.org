import PQueue from "p-queue";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";

const queue = new PQueue({
    intervalCap: 45,
    interval: 1000,
    carryoverConcurrencyCount: true
});

async function validateDiscordUser(userId: string) {
    try {
        const response = await fetch(`https://discord.com/api/v9/users/${userId}`, {
            headers: {
                Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
            }
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return {
            id: data.id,
            username: data.username,
            avatar: data.avatar
        };
    } catch (error) {
        console.error("Failed to fetch Discord user:", error);
        return null;
    }
}

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({ message: "Method not allowed", wants: "POST" });
        }

        const { users } = req.body;
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(400).json({ message: "Cannot check authorization without unique token" });
        }

        const token = authorization?.replace("Bearer ", "")?.trim() ?? null;

        if (!token) {
            return res.status(400).json({ message: "Invalid Request, unique user token is missing" });
        }
        const user = await isAuthed(token as string);

        if (!user) {
            return res.status(401).json({ status: 401, message: "Given token is not authorized" });
        }

        if (!users || !Array.isArray(users)) {
            return res.status(400).json({ message: "Missing users array in body" });
        }

        if (users.length > 5) {
            return res.status(400).json({ message: "Maximum 5 users allowed per request" });
        }

        const validationPromises = users.map((userId) => queue.add(() => validateDiscordUser(userId)));

        const validatedUsers = await Promise.all(validationPromises);
        const filteredUsers = validatedUsers.filter((user) => user !== null);

        if (filteredUsers.length === 0) {
            return res.status(404).json({ status: 404, message: "No valid Discord users found" });
        }

        return res.status(200).json({ users: filteredUsers });
    } catch {
        return res.status(500).json({ status: 500, message: "Internal server error" });
    }
}
