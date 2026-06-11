/**
 * A like entry as returned by /api/likes/get.
 *
 * The raw `likes` collection documents have the shape
 * `{ themeId: number; userIds: string[] }`, but the handler maps them to
 * `{ themeId, likes: userIds.length }` and additionally includes
 * `hasLiked` when the request carries a valid auth token.
 */
export interface LikeEntry {
    themeId: number;
    likes?: number;
    hasLiked?: boolean;
}

/** Response shape of /api/likes/get. */
export interface LikesData {
    status: number;
    likes: LikeEntry[];
}
