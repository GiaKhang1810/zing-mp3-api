import type { CookieRecord } from '../types/cookie.js';
export declare class Cookies {
    private readonly store;
    setCookie(setCookie: string, requestUrl: string): void;
    setCookies(setCookies: string[] | undefined, requestUrl: string): void;
    getCookies(requestUrl: string): CookieRecord[];
    getCookieHeader(requestUrl: string): string;
    applyToHeaders(requestUrl: string, headers?: Record<string, string>): Record<string, string>;
    deleteCookie(domain: string, path: string, name: string): void;
    cleanup(): void;
    toJSON(): CookieRecord[];
    fromJSON(cookies: CookieRecord[]): void;
}
