import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise, { THEMES_DB } from "@utils/db";
import { getToken } from "@utils/auth";
import { clearSessionCookie } from "@utils/sessionCookie";
import { ErrorHandler } from "@lib/errorHandler";

async function DELETE(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "DELETE") {
        return res.status(405).json({ message: "Method not allowed", wants: "DELETE" });
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

    const user = await users.findOne({ "user.id": userId, "user.key": token });

    if (!user) {
        return res.status(400).json({ message: "No user found with those credentials" });
    }

    if (user.user.admin) {
        return res.status(400).json({ message: "Cannot delete admin user" });
    }

    const userEntry = await users.deleteOne({ "user.id": userId, "user.key": token });

    res.setHeader("Content-Type", "application/json");

    if (userEntry.deletedCount === 0) {
        res.status(500).json({ status: 400, message: "No user found with those credentials" });
    } else {
        clearSessionCookie(res);
        res.status(200).json({ status: 200, authorized: false, message: "Deleted user entry" });
    }
}

export default ErrorHandler(DELETE);