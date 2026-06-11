import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, authenticated: false });
    }

    let user;
    try {
        user = await isAuthed(token as string);
    } catch (error) {
        // Internal failure (e.g. database unreachable) — do NOT report the user
        // as unauthenticated, since clients treat `authenticated: false` as a
        // definitive invalid token and clear the session cookie.
        console.error("Failed to verify authentication:", error);
        return res.status(500).json({ status: 500, message: "Internal server error" });
    }

    res.setHeader("Content-Type", "application/json");

    if (!user) {
        // Token was checked and is definitively not valid.
        res.status(401).json({ status: 401, authenticated: false });
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
