const env = process.env.NODE_ENV;

export const DEV_SERVER = "http://localhost:4321";
export const PRODUCION_SERVER = "themes.equicord.org";
export const SERVER = env === "development" ? DEV_SERVER : PRODUCION_SERVER;
export const RAW_SERVER = env === "development" ? "http://localhost:4321" : "themes.equicord.org";
