import clientPromise, { THEMES_DB } from "@utils/db";
import { createHash, randomBytes } from "crypto";
import type { NextApiRequest } from "next";

export const getToken = (req: NextApiRequest): string => {
    const cookieToken = req.cookies?._dtoken;
    if (cookieToken) return cookieToken.trim();

    const auth = req.headers.authorization;
    if (auth) return auth.replace("Bearer ", "").trim();

    return "";
};

export const isAuthed = async (token: string) => {
    if (!token) return false;
    const user = await getUser(token);

    if (!user) return false;

    return user;
};

export const getUser = async (token: string) => {
    if (!token) return null;

    const client = await clientPromise;
    const users = client.db(THEMES_DB).collection("users");
    const entry = await users.findOne({ "user.key": token });

    return entry?.user;
};

export const generateKey = () => {
    const randomData = randomBytes(32);
    const salt = randomBytes(16);
    const timestamp = new Date().getTime().toString();

    return createHash("sha256")
        .update(Buffer.concat([randomData, salt]))
        .update(timestamp)
        .digest("hex");
};
