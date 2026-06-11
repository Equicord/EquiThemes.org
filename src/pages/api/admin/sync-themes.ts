import { ErrorHandler } from "@lib/errorHandler";
import clientPromise, { SUBMISSIONS_DB, THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(403).json({ status: 403, message: "Unauthorized. Admin access required." });
    }

    const user = await isAuthed(token as string);

    if (!user || !user.admin) {
        return res.status(403).json({ status: 403, message: "Unauthorized. Admin access required." });
    }

    try {
        const client = await clientPromise;
        const themesDb = client.db(THEMES_DB);
        const themesCollection = themesDb.collection("themes");

        const themes = await themesCollection.find({}, { projection: { _id: 0 } }).toArray();
        const approvedTotal = themes.length;

        const submittedDb = client.db(SUBMISSIONS_DB);
        const pendingCollection = submittedDb.collection("pending");
        const submissions = await pendingCollection.find({}).toArray();
        const submissionUpdates = [];

        for (const submission of submissions) {
            const truncatedTitle = submission.title.slice(0, 40);
            if (submission.title !== truncatedTitle) {
                submissionUpdates.push({
                    updateOne: {
                        filter: { _id: submission._id },
                        update: { $set: { title: truncatedTitle } }
                    }
                });
            }
        }

        let submissionsUpdated = 0;
        if (submissionUpdates.length > 0) {
            const result = await pendingCollection.bulkWrite(submissionUpdates);
            submissionsUpdated = result.modifiedCount || 0;
        }

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");

        return res.status(200).json({
            status: 200,
            message: "Database sync completed successfully",
            approved: {
                total: approvedTotal
            },
            submissions: {
                updated: submissionsUpdated,
                total: submissions.length,
                description: "Pending/rejected themes - titles truncated to 40 characters max"
            }
        });
    } catch (error) {
        console.error("Database sync error:", error);
        return res.status(500).json({
            status: 500,
            message: "Failed to sync database",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}

export default ErrorHandler(POST);
