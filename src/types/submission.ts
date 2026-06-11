import type { ValidatedUser } from "./user";

export interface SubmittedAt {
    $date: string;
}

export interface Moderator {
    discord_snowflake: string;
    discord_name: string;
    avatar_url: string;
}

/** Form state used by the theme submit page (/theme/submit). */
export interface SubmitFormData {
    title: string;
    file: string | null;
    fileUrl: string;
    description: string;
    contributors: string[];
    sourceLink: string;
    validatedUsers: Record<string, ValidatedUser>;
}

/**
 * A pending/processed theme submission document from the
 * `submittedThemesDatabase.pending` collection, as returned by
 * /api/get/submissions.
 *
 * Fields are optional where one consumer omits them:
 * - `themeContent`, `file` and `fileUrl` are projected out of list responses.
 * - `moderator` and `reason` only exist once a moderator has acted.
 * - `submittedAt` is stored as a BSON Date and is serialized to an ISO
 *   string by `res.json()` / `JSON.stringify`, which is what every consumer
 *   receives at runtime.
 */
export interface ThemeSubmission {
    _id: string;
    title: string;
    description: string;
    file?: string;
    fileUrl?: string;
    contributors?: string[];
    sourceLink: string;
    validatedUsers: { [key: string]: ValidatedUser };
    themeContent?: string;
    submittedAt: string;
    submittedBy?: string;
    state: "pending" | "approved" | "rejected";
    reason?: string;
    moderator?: Moderator;
}
