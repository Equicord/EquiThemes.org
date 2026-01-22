const env = process.env.NODE_ENV;
const SERVER = env === "development" ? "https://literate-engine-rv7579wprjq2px77-4321.app.github.dev" : "https://themes.equicord.org";
const siteUrl = SERVER;

module.exports = {
    siteUrl,
    generateRobotsTxt: true,
    robotsTxtOptions: {
        policies: [{ userAgent: "*", allow: "/" }]
    },
    exclude: ["/admin/*", "/auth/*", "/users/@me/settings", "/admin"]
};
