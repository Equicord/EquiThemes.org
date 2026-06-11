/**
 * Seeds the local dev MongoDB with live data from themes.equicord.org.
 * Usage: bun scripts/seed-dev.js  (bun auto-loads .env for MONGODB_URI)
 */
const { MongoClient } = require("mongodb");

const SOURCE = process.env.SEED_SOURCE_URL || "https://themes.equicord.org";
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/themesDatabase";
const THEMES_DB = process.env.MONGODB_THEMES_DB || "themesDatabase";
const SUBMISSIONS_DB = process.env.MONGODB_SUBMISSIONS_DB || "submittedThemesDatabase";

async function main() {
    console.log(`Fetching themes from ${SOURCE}/api/themes ...`);
    const res = await fetch(`${SOURCE}/api/themes`);
    if (!res.ok) throw new Error(`Failed to fetch themes: ${res.status}`);
    const themes = await res.json();
    console.log(`Fetched ${themes.length} themes (with content).`);

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(THEMES_DB);

    const themesCol = db.collection("themes");
    await themesCol.deleteMany({});
    await themesCol.insertMany(themes);
    console.log(`Inserted ${themes.length} themes into ${THEMES_DB}.themes`);

    // Like documents: { themeId, userIds } — counts aren't public per-user,
    // so seed each theme's likes as an empty list (endpoints stay functional).
    const likesCol = db.collection("likes");
    await likesCol.deleteMany({});
    await likesCol.insertMany(themes.map((t) => ({ themeId: Number(t.id), userIds: [] })));
    console.log(`Inserted ${themes.length} empty like documents into ${THEMES_DB}.likes`);

    // Users are created on first Discord login; just ensure the collection exists.
    await db.createCollection("users").catch(() => {});

    // Pending submissions aren't public; ensure the collection exists so admin pages work.
    await client.db(SUBMISSIONS_DB).createCollection("pending").catch(() => {});

    const count = await themesCol.countDocuments();
    console.log(`Done. ${THEMES_DB}.themes now has ${count} documents.`);
    await client.close();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
