import clientPromise, { SUBMISSIONS_DB } from "@utils/db";
import { ObjectId } from "mongodb";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

// These domain types now live in src/types; ThemeSubmission replaces the old
// local RootObject interface.
export type { ValidatedUser, SubmittedAt, Moderator, ThemeSubmission } from "@types";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const client = await clientPromise;
    const db = client.db(SUBMISSIONS_DB);
    const themesCollection = db.collection("pending");

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const user = await isAuthed(token as string);

    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }

    const { id } = req.query;

    if (id) {
        try {
            const theme = await themesCollection.findOne({ _id: new ObjectId(id as string) });
            if (!theme) {
                return res.status(404).json({ message: "Submission not found" });
            }
            if (!user.admin && theme.submittedBy !== user.id) {
                return res.status(403).json({ message: "Forbidden" });
            }
            return res.status(200).json(theme);
        } catch (err) {
            return res.status(400).json({ message: "Invalid ID format" });
        }
    }

    const query = user.admin ? {} : { submittedBy: user.id };
    const themes = await themesCollection.find(query, { projection: { themeContent: 0, file: 0, fileUrl: 0 } }).toArray();

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(themes);
}

export default ErrorHandler(GET);