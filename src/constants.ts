const env = process.env.NODE_ENV;

export const DEV_SERVER = "http://localhost:3000";
export const PRODUCION_SERVER = "https://themes.equicord.org";
export const SERVER = env === "development" ? DEV_SERVER : PRODUCION_SERVER;
export const RAW_SERVER = env === "development" ? "localhost:3000" : "themes.equicord.org";
