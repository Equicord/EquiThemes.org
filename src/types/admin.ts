/** MongoDB `serverStatus.connections` (see /api/internal). */
export interface ServerConnections {
    current: number;
    available: number;
    totalCreated: number;
    active?: number;
    threaded?: number;
    exhaustIsMaster?: number;
    exhaustHello?: number;
    awaitingTopologyChanges?: number;
}

/** MongoDB `serverStatus.network` (see /api/internal). */
export interface ServerNetwork {
    bytesIn: number;
    bytesOut: number;
    numRequests: number;
}

/** MongoDB `serverStatus.opcounters` (see /api/internal). */
export interface ServerOpcounters {
    insert: number;
    query: number;
    update: number;
    delete: number;
    getmore: number;
    command: number;
}

export interface InternalUserStats {
    monthly: {
        count: number;
        timeframe: string;
    };
    total: number;
}

export interface InternalThemeStats {
    total: number;
    totalDownloads: number;
    pendingSubmissions: number;
    topAuthor: {
        discord_snowflake: string;
        themeCount: number;
    };
    mostLiked: string;
}

/** MongoDB `db.stats()` subset returned by /api/internal. */
export interface InternalDbStats {
    collections: number;
    objects: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    size: number;
}

/** MongoDB `serverStatus` subset returned by /api/internal. */
export interface InternalServerStats {
    cn: ServerConnections;
    nw: ServerNetwork;
    op: ServerOpcounters;
    up: number;
}

/** Response shape of /api/internal. */
export interface InternalStats {
    users: InternalUserStats;
    themes: InternalThemeStats;
    dbst: InternalDbStats;
    sst: InternalServerStats;
}
