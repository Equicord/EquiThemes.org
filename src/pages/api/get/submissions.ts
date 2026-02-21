import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";
export interface ValidatedUser {
	id: string;
	username: string;
	avatar: string;
}

export interface SubmittedAt {
	$date: string;
}

export interface Moderator {
	discord_snowflake: string;
	discord_name: string;
	avatar_url: string;
}

export interface RootObject {
	title: string;
	description: string;
	sourceLink: string;
	validatedUsers: { [key: string]: ValidatedUser };
	themeContent: string;
	submittedAt: SubmittedAt;
    reason: string;
	state: string;
	moderator: Moderator;
}

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const client = await clientPromise;
    const db = client.db("submittedThemesDatabase");
    const themesCollection = db.collection("pending");

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

    let themes = await themesCollection.find({}).toArray();

    if (!user.admin) {
        themes = themes.filter((theme) => theme.user === user.username);
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(themes);
}

export default ErrorHandler(GET);