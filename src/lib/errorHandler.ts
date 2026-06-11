import type { NextApiRequest, NextApiResponse } from "next";

type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void;

export function ErrorHandler(handler: Handler) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        try {
            await handler(req, res);
        } catch (error) {
            console.error(error);
            if (!res.headersSent) {
                res.status(500).json({
                    status: 500,
                    message: "Internal Server Error"
                });
            }
        }
    };
}
