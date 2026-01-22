import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { authorization } = req.headers;
    const { donationLink, websiteLink, userId } = req.body;

    if (!authorization) {
        return res.status(400).json({ message: "Cannot check authorization without unique token" });
    }

    const token = authorization.replace("Bearer ", "").trim();
    if (!token) {
        return res.status(400).json({ status: 400, message: "Invalid Request, unique user token is missing" });
    }

    const user = await isAuthed(token as string);
    if (!user) {
        return res.status(401).json({ status: 401, message: "Given token is not authorized" });
    }
    if (!userId || userId !== user.id) {
        return res.status(403).json({ status: 403, message: "Unauthorized: userId mismatch" });
    }

    if (websiteLink && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(websiteLink)) {
        return res.status(400).json({ status: 400, message: "Invalid website link format" });
    }

    if (donationLink && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(donationLink)) {
        return res.status(400).json({ status: 400, message: "Invalid donation link format" });
    }

    try {
        const client = await clientPromise;
        const users = client.db("themesDatabase").collection("users");

        const result = await users.updateOne(
            { "user.id": userId },
            {
                $set: {
                    donationLink: donationLink || "",
                    websiteLink: websiteLink || "",
                }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ status: 404, message: "User not found or no changes made" });
        }

        return res.status(200).json({ status: 200, message: "Links updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 500, message: "Internal Server Error" });
    }
}
