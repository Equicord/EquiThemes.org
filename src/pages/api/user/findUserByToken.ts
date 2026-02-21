import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(400).json({ message: "Cannot check authorization without unique token" });
    }

    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
        return res.status(400).json({ message: "Cannot check authorization without unique token" });
    }

    const user = await isAuthed(token as string);

    res.setHeader("Content-Type", "application/json");

    if (!user) {
        res.status(500).json({ status: 404, message: "No user found with those credentials" });
    } else {
        res.status(200).json({ status: 200, user });
    }
}

export default ErrorHandler(GET);