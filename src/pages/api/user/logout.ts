import type { NextApiRequest, NextApiResponse } from "next";
import { ErrorHandler } from "@lib/errorHandler";
import { clearSessionCookie } from "@utils/sessionCookie";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    clearSessionCookie(res);
    res.status(200).json({ status: 200, message: "Logged out" });
}

export default ErrorHandler(POST);
