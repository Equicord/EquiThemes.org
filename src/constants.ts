const env = process.env.NODE_ENV;

export const DEV_SERVER = "http://localhost:3000";
export const PRODUCION_SERVER = "https://themes.equicord.org";
export const SERVER = process.env.NEXT_PUBLIC_SERVER_URL || (env === "development" ? DEV_SERVER : PRODUCION_SERVER);
export const RAW_SERVER = SERVER.replace(/^https?:\/\//, "");
