import clientPromise from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";
import { isAuthed } from "@utils/auth";
import { ObjectId } from "mongodb";
import { validateInvite } from "@utils/extractInvite";
import { SERVER } from "@constants";
import { ErrorHandler } from "@lib/errorHandler";

async function POST(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed", wants: "POST" });
    }

    const { authorization } = req.headers;
    const { id } = req.query;
    const { tags } = req.body;

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

    if (!user.admin) {
        return res.status(403).json({ status: 403, message: "Unauthorized" });
    }

    if (!id) {
        return res.status(400).json({
            status: 400,
            message: "Invalid Request - Missing required fields",
            fields: ["id"]
        });
    }

    try {
        const client = await clientPromise;
        const submittedDb = client.db("submittedThemesDatabase");
        const themesDb = client.db("themesDatabase");
        const pendingCollection = submittedDb.collection("pending");
        const themesCollection = themesDb.collection("themes");
        const notificationsCollection = themesDb.collection("notifications");

        const theme = await pendingCollection.findOne({ _id: new ObjectId(id as string) });

        if (!theme) {
            return res.status(404).json({
                status: 404,
                message: "Theme not found"
            });
        }

        if (theme.state !== "pending") {
            return res.status(400).json({
                status: 400,
                message: "Theme is not pending"
            });
        }

        const totalThemes = await themesCollection.countDocuments();

        let imageExt = "png";
        let base64Content = "";
        let isBase64 = false;

        if (theme.file.startsWith("data:image")) {
            const mimeMatch = theme.file.match(/^data:image\/([a-zA-Z]+);base64,/);
            if (!mimeMatch) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid image format"
                });
            }
            imageExt = mimeMatch[1];
            base64Content = theme.file.split(",")[1];
            isBase64 = true;
        } else if (theme.file.startsWith("http")) {
            const imgRes = await fetch(theme.file);
            if (!imgRes.ok) {
                return res.status(400).json({
                    status: 400,
                    message: "Failed to fetch remote image"
                });
            }
            const arrayBuffer = await imgRes.arrayBuffer();
            base64Content = Buffer.from(arrayBuffer).toString("base64");

            const contentType = imgRes.headers.get("content-type");
            if (contentType && contentType.startsWith("image/")) {
                imageExt = contentType.split("/")[1];
            } else {
                const urlExt = theme.file.split(".").pop();
                if (urlExt && ["png", "jpg", "jpeg", "gif", "webp"].includes(urlExt.toLowerCase())) {
                    imageExt = urlExt.toLowerCase();
                }
            }
            isBase64 = true;
        } else {
            return res.status(400).json({
                status: 400,
                message: "Invalid image format"
            });
        }

        const safeTitle = theme.title.replace(/ /g, "-");
        const fileName = `${safeTitle}_${totalThemes + 1}.${imageExt}`;

        if (isBase64) {
            const fs = require('fs');
            const path = require('path');
            const localPath = path.join(process.cwd(), 'public', 'thumbnails', fileName);
            try {
                fs.writeFileSync(localPath, Buffer.from(base64Content, "base64"));
            } catch (err) {
                console.error("Failed to write thumbnail locally:", err);
            }

            const githubResponse = await fetch(`https://api.github.com/repos/Equicord/Equithemes.org/contents/public/thumbnails/${fileName}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    "Content-Type": "application/json",
                    Accept: "application/vnd.github.v3+json"
                },
                body: JSON.stringify({
                    message: `${theme.title}: approved`,
                    content: base64Content,
                    branch: "master"
                })
            });

            if (!githubResponse.ok) {
                return res.status(500).json({
                    status: 500,
                    message: "Failed to upload thumbnail to GitHub"
                });
            }
        }

        const metadataMatch = Buffer.from(theme.themeContent, "base64")
            .toString()
            .match(/\/\*[\s\S]*?\*\//);
        if (!metadataMatch) {
            return res.status(400).json({
                status: 400,
                message: "Invalid theme metadata"
            });
        }

        const inviteMatch = metadataMatch[0].match(/@invite\s+(.+)/);
        let guildInfo = null;

        if (inviteMatch) {
            guildInfo = await validateInvite(inviteMatch[1].trim());
            if (!guildInfo) {
                return res.status(400).json({
                    status: 400,
                    message: "Invalid Discord invite link"
                });
            }
        }

        const version = metadataMatch[0].match(/@version\s+(.+)/);

        const newTheme = {
            name: theme.title,
            id: totalThemes + 1,
            type: tags.includes("snippet") ? "snippet" : "theme",
            description: theme.description,
            // eslint-disable-next-line no-unused-vars
            author: Object.entries(theme.validatedUsers).map(([id, user]: [string, any]) => ({
                discord_snowflake: user.id,
                discord_name: user.name || "",
                avatar_url: user.avatar || "",
                github_name: user.github_name || ""
            })),
            tags: tags.length > 0 ? [...tags] : [],
            version: version ? version[1] : "1.0.0",
            thumbnail_url: isBase64 ? `${SERVER}/thumbnails/${fileName}` : theme.file,
            release_date: new Date().toISOString(),
            guild: guildInfo,
            content: theme.themeContent,
            source: theme.sourceLink,
            likes: 0
        };

        await themesCollection.insertOne(newTheme);

        await pendingCollection.updateOne(
            { _id: new ObjectId(id as string) },
            {
                $set: {
                    state: "approved",
                    approvedAt: new Date(),
                    moderator: {
                        discord_snowflake: user.id,
                        discord_name: user.global_name || "",
                        avatar_url: user.avatar || ""
                    }
                },
                $unset: {
                    contributors: "",
                    submittedBy: ""
                }
            }
        );

        await notificationsCollection.insertOne({
            userId: theme.submittedBy,
            type: "theme_approved",
            themeId: id,
            themeName: theme.title,
            message: `Your theme "${theme.title}" has been approved!`,
            createdAt: new Date(),
            read: false
        });

        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        return res.status(200).json({ status: 200, title: theme.title, message: "Theme approved" });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 500,
            message: "Internal Server Error"
        });
    }
}

export default ErrorHandler(POST);