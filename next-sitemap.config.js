const siteUrl = process.env.NEXT_PUBLIC_SERVER_URL || "https://themes.equicord.org";

module.exports = {
    siteUrl,
    generateRobotsTxt: true,
    robotsTxtOptions: {
        policies: [{ userAgent: "*", allow: "/" }]
    },
    exclude: ["/admin/*", "/auth/*", "/users/@me/settings", "/admin"]
};
