import { ErrorHandler } from "@lib/errorHandler";
import { getToken, isAuthed } from "@utils/auth";
import clientPromise, { SUBMISSIONS_DB, THEMES_DB } from "@utils/db";
import type { NextApiRequest, NextApiResponse } from "next";

async function GET(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed", wants: "GET" });
    }

    const token = getToken(req);
    const user = await isAuthed(token);
    if (!user || !user.admin) return res.status(403).json({ status: 403, message: "Admin access required" });

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const agg = [
        {
            $facet: {
                totalUsers: [{ $count: "total" }],
                monthlyUsers: [{ $match: { createdAt: { $gte: firstDayOfMonth } } }, { $count: "total" }],
                totalThemes: [{ $count: "total" }]
            }
        }
    ];

    const client = await clientPromise;
    const db = client.db(THEMES_DB);

    const usersColl = db.collection("users");
    const themesColl = db.collection("themes");
    const likesColl = db.collection("likes");

    const authorAgg = [
        {
            $group: {
                _id: "$author.discord_snowflake",
                themeCount: { $sum: 1 }
            }
        },
        { $sort: { themeCount: -1 } },
        { $limit: 1 },
        {
            $lookup: {
                from: "themes",
                localField: "_id",
                foreignField: "author.discord_snowflake",
                as: "themes"
            }
        }
    ];

    const downloadsAgg = [
        {
            $group: {
                _id: null,
                totalDownloads: { $sum: "$downloads" }
            }
        }
    ];

    const likesAgg = [
        {
            $project: {
                themeId: 1,
                likesCount: { $size: "$userIds" }
            }
        },
        { $sort: { likesCount: -1 } },
        { $limit: 1 },
        {
            $project: {
                _id: 0,
                themeId: 1
            }
        }
    ];

    const submittedDb = client.db(SUBMISSIONS_DB);
    const pendingColl = submittedDb.collection("pending");

    const [usersResult, themesResult, authorResult, downloadsResult, likesResult, dbStats, serverStatus, pendingCount] = await Promise.all([
        usersColl.aggregate(agg).toArray(),
        themesColl.aggregate([{ $count: "total" }]).toArray(),
        themesColl.aggregate(authorAgg).toArray(),
        themesColl.aggregate(downloadsAgg).toArray(),
        likesColl.aggregate(likesAgg).toArray(),
        db.stats(),
        db.command({ serverStatus: 1 }),
        pendingColl.countDocuments({ state: "pending" })
    ]);

    const topAuthor = authorResult[0] || { _id: null, themeCount: 0, themes: [] };
    const totalDownloads = downloadsResult[0]?.totalDownloads || 0;
    const mostLikedTheme = likesResult[0]?.themeId || null;

    const totalUsers = usersResult[0].totalUsers[0]?.total || 0;
    const monthlyUsers = usersResult[0].monthlyUsers[0]?.total || 0;
    const totalThemes = themesResult[0]?.total || 0;

    const data = {
        users: {
            monthly: {
                count: monthlyUsers,
                timeframe: `${firstDayOfMonth.toISOString()}-${currentDate.toISOString()}`
            },
            total: totalUsers
        },
        themes: {
            total: totalThemes,
            totalDownloads: totalDownloads,
            pendingSubmissions: pendingCount,
            topAuthor: {
                discord_snowflake: topAuthor._id,
                themeCount: topAuthor.themeCount
            },
            mostLiked: mostLikedTheme
        },
        dbst: {
            collections: dbStats.collections,
            objects: dbStats.objects,
            dataSize: dbStats.dataSize,
            storageSize: dbStats.storageSize,
            indexes: dbStats.indexes,
            size: dbStats.indexSize
        },
        sst: {
            cn: serverStatus.connections,
            nw: serverStatus.network,
            op: serverStatus.opcounters,
            up: serverStatus.uptime
        }
    };

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
}

export default ErrorHandler(GET);