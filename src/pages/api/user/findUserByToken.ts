import type { NextApiRequest, NextApiResponse } from "next";
import { getToken, isAuthed } from "@utils/auth";
import { ErrorHandler } from "@lib/errorHandler";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const token = getToken(req);

    if (!token) {
        return res.status(401).json({ status: 401, message: "No user found with those credentials" });
    }

    const user = await isAuthed(token as string);

    res.setHeader("Content-Type", "application/json");

    if (!user) {
        res.status(500).json({ status: 404, message: "No user found with those credentials" });
    } else {
        const publicUser = {
            id: user.id,
            admin: user.admin ?? false,
            avatar: user.avatar,
            global_name: user.global_name,
            preferredColor: user.preferredColor,
            bannedFromSubmissions: user.bannedFromSubmissions ?? false,
            banReason: user.banReason,
            githubAccount: user.githubAccount ?? "unverified",
            donationLink: user.donationLink,
            websiteLink: user.websiteLink,
            socials: user.socials
        };
        res.status(200).json({ status: 200, user: publicUser });
    }
}

export default ErrorHandler(GET);