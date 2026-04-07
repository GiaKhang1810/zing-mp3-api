import type { Cookies } from '../utils/cookies.js';

type SearchCategory = 'music' | 'video' | 'artist' | 'playlist';

interface ClientOptions {
    maxLoad?: number;
    maxHighWaterMark?: number;
    userAgent?: string;
    jar?: Cookies;
}

export type {
    ClientOptions,
    SearchCategory
}