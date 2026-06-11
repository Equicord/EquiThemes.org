import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise, { THEMES_DB } from "@utils/db";
import { getToken } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const token = getToken(req);
    if (!token) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }

    const client = await clientPromise;
    const users = client.db(THEMES_DB).collection("users");

    const requester = await users.findOne({ "user.key": token });
    if (!requester) {
        return res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
    if (!requester.user.admin) {
        return res.status(403).json({ message: "Unauthorized - Insufficient permissions" });
    }

    const rawQuery = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
    const query = (rawQuery ?? "").trim().slice(0, 64);

    if (query.length < 2) {
        return res.status(200).json({ status: 200, users: [] });
    }

    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };

    const matches = await users
        .find(
            { $or: [{ "user.global_name": regex }, { "user.username": regex }, { "user.id": regex }] },
            { projection: { _id: 0, "user.id": 1, "user.username": 1, "user.global_name": 1, "user.avatar": 1 }, limit: 8 }
        )
        .toArray();

    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json({
        status: 200,
        users: matches.map(m => ({
            id: m.user?.id,
            username: m.user?.username ?? null,
            global_name: m.user?.global_name ?? null,
            avatar: m.user?.avatar ?? null
        }))
    });
}

export default ErrorHandler(GET);
