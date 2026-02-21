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

    console.log("User:", user);

    if (!user) {
        res.status(500).json({ status: 401, authenticated: false });
    } else {
        // @ts-ignore
        res.status(200).json({
            status: 200,
            authenticated: true,
            user: {
                id: user.id,
                admin: user.admin ?? false,
                preferredColor: user.preferredColor,
                avatar: user.avatar,
                global_name: user.global_name,
                bannedFromSubmissions: user.bannedFromSubmissions ?? false,
                banReason: user.banReason,
                social: { github: user.githubAccount ?? "unverified" }
            }
        });
    }
}

export default ErrorHandler(GET);
