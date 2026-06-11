import type { NextApiRequest, NextApiResponse } from "next";
import { generateKey, getToken } from "@utils/auth";
import { setSessionCookie } from "@utils/sessionCookie";
import clientPromise, { THEMES_DB } from "@utils/db";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { userId } = req.body;

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ message: "Cannot revoke authorization without unique token" });
    }

    if (!userId) {
        return res.status(400).json({ message: "Cannot revoke authorization without user id" });
    }

    const client = await clientPromise;
    const db = client.db(THEMES_DB);
    const users = db.collection("users");
    const key = generateKey();

    const userEntry = await users.updateOne({ "user.id": userId, "user.key": token }, { $set: { "user.key": key.toString() } });

    res.setHeader("Content-Type", "application/json");

    if (userEntry.modifiedCount === 0) {
        res.status(500).json({ status: 400, message: "No user found with those credentials" });
    } else {
        setSessionCookie(res, key.toString());
        res.status(200).json({ status: 200, token: key.toString() });
    }
}

export default ErrorHandler(POST);