import type { NextApiRequest, NextApiResponse } from "next";
import { generateKey } from "@utils/auth";
import clientPromise from "@utils/db";

export default async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
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
    const key = generateKey();

    const userEntry = await users.updateOne({ "user.id": userId, "user.key": token }, { $set: { "user.key": key.toString() } });

    res.setHeader("Content-Type", "application/json");

    if (userEntry.modifiedCount === 0) {
        res.status(500).json({ status: 400, message: "No user found with those credentials" });
    } else {
        res.status(200).json({ status: 200, token: key.toString() });
    }
}
