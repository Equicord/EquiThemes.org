import { APIUser as User } from "discord-api-types/v10";

export interface Author {
    github_name?: string;
    discord_name: User["username"];
    discord_snowflake: User["id"];
}

export interface Theme {
    last_updated: string;
    id: string;
    name: string;
    file_name: string;
    content: string;
    type: string | "theme" | "snippet";
    description: string;
    external_url?: string;
    download_url: string;
    version?: string;
    author: Author | Author[];
    likes?: number;
    downloads?: number;
    tags: string[];
    thumbnail_url: string;
    release_date: string;
    guild?: {
        name: string;
        snowflake: string;
        invite_link: string;
    };
    source?: string;
}

export interface ThemesResponse {
    themes: Theme[];
    user: {
        id: string;
        global_name: string;
        preferredColor: string;
        avatar: string;
        admin?: boolean;
        joinedAt?: string;
        lastActive?: string;
    };
}

/**
 * A theme as returned by list endpoints fetched with `?content=false`
 * (e.g. /api/themes?content=false), where `content` is projected out.
 */
export type ThemeListItem = Omit<Theme, "content"> & { content?: string };

/** Payload built by the edit-theme modal and sent to PUT /api/themes/[id]. */
export interface ThemeUpdatePayload {
    name: string;
    description: string;
    version: string;
    sourceLink: string;
    last_updated: string;
    content?: string;
    tags?: string[];
}
