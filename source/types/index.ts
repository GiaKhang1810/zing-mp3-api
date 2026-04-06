type SearchCategory = 'artist' | 'music' | 'playlist' | 'video';

interface ClientOptions {
    maxRate?: [Download?: number, HighWaterMark?: number];
}

interface RequiredClientOptions {
    maxRate: [Download: number, HighWaterMark: number];
}

export type {
    ClientOptions,
    RequiredClientOptions,
    SearchCategory
}