import type { Cookies } from '../utils/cookies.js';

interface ClientOptions {
    maxLoad?: number;
    maxHighWaterMark?: number;
    userAgent?: string;
    jar?: Cookies;
}

export type {
    ClientOptions
}