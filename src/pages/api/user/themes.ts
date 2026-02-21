"use cache";

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@utils/db";
import { isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { userId } = req.body;
    const { authorization } = req.headers;

    const token = authorization?.replace("Bearer ", "").trim();

    if (!token && !userId) {
        return res.status(400).json({ message: "Cannot get themes without unique token or user ID" });
    }

    const client = await clientPromise;
    const db = client.db("themesDatabase");
    const users = db.collection("users");

    let requestedUser;

    if (userId === "@me") {
        const auth = await isAuthed(token as string);
        if (!auth) return res.status(401).json({ status: 401, message: "Unauthorized" });
        const userEntry = await users.findOne({ "user.key": auth.key });
        if (!userEntry) return res.status(404).json({ status: 400, message: "No user found with those credentials" });
        delete userEntry.user.key;
        delete userEntry._id;
        userEntry.user.current = true;
        requestedUser = userEntry?.user;
    } else {
        const userEntry = await users.findOne({ "user.id": String(userId) });
        if (!userEntry) return res.status(404).json({ status: 400, message: "No user found with those credentials" });
        delete userEntry.user.key;
        delete userEntry._id;
        userEntry.user.current = false;
        requestedUser = userEntry?.user;
    }

    const themes = db.collection("themes");
    const userThemes = await themes.find({ "author.discord_snowflake": String(requestedUser.id) }).toArray();

    userThemes.forEach((theme) => {
        delete theme._id;
    });

    res.setHeader("Content-Type", "application/json");

    if (!userThemes) {
        res.status(400).json({ status: 400, message: "No themes found for that user" });
    } else {
        res.status(200).json({ status: 200, themes: userThemes, user: requestedUser });
    }
}

export default ErrorHandler(POST);