/** @type {import("next").NextConfig} */
const env = process.env.NODE_ENV;
const RAW_SERVER = env === "development" ? "literate-engine-rv7579wprjq2px77-4321.app.github.dev" : "themes.equicord.org";

module.exports = {
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Credentials", value: "true" },
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
                    { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" }
                ]
            },
            {
                source: "/api/download",
                headers: [
                    {
                        key: "cache-control",
                        value: "s-maxage=600, stale-while-revalidate=30"
                    }
                ]
            },
            {
                source: "/api/get/:path*",
                headers: [
                    {
                        key: "cache-control",
                        value: "no-cache, no-store, must-revalidate"
                    }
                ]
            },
            {
                source: "/api/thumbnail/:name*",
                headers: [
                    {
                        key: "cache-control",
                        value: "s-maxage=600, stale-while-revalidate=30"
                    }
                ]
            }
        ];
    },
    rewrites() {
        return {
            beforeFiles: [
                {
                    source: "/:path*",
                    has: [
                        {
                            type: "host",
                            value: `api.${RAW_SERVER}`
                        }
                    ],
                    destination: "/api/:path*"
                },
                {
                    source: "/api/thumbnail/:name*",
                    has: [
                        {
                            type: "host",
                            value: `cdn.${RAW_SERVER}`
                        }
                    ],
                    destination: "/api/thumbnail/:name*"
                }
            ]
        };
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "cdn.discordapp.com",
                pathname: "**"
            },
            {
                protocol: "https",
                hostname: "cdn.themes.equicord.org",
                pathname: "**"
            }
        ]
    },
    experimental: {
        dynamicIO: true
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    reactStrictMode: false,
    productionBrowserSourceMaps: false,
    typescript: {
        ignoreBuildErrors: true
    }
};
