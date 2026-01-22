import clientPromise from "@utils/db";
import { createHash, randomBytes } from "crypto";

export const isAuthed = async (token: string) => {
    if (!token) return false;
    const user = await getUser(token);

    if (!user) return false;

    return user;
};

export const getUser = async (token: string) => {
    if (!token) return null;

    const client = await clientPromise;
    const users = client.db("themesDatabase").collection("users");
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
