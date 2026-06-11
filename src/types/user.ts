import { APIUser as User } from "discord-api-types/v10";
import type { Theme } from "./theme";

export interface UserData {
    id: User["id"];
    avatar?: User["avatar"];
    global_name?: User["global_name"];
    username: User["username"];
    preferredColor?: User["accent_color"];
    admin?: boolean;
    socials?: { github?: string; }
    donationLink?: string;
    websiteLink?: string;
    bannedFromSubmissions?: boolean;
    banReason?: string;
}

export interface Notification {
    id?: string;
    userId: User["id"];
    type: "theme_approved" | "theme_rejected" | "user_banned" | "user_unbanned" | "announcement";
    themeId?: string;
    themeName?: string;
    message: string;
    reason?: string;
    createdAt: string;
    read?: boolean;
}

export interface ValidatedUser {
    id: string;
    username: string;
    avatar: string;
}

export interface UserActivity {
    popularThemes: Theme[];
}
