type CookieSameSite = 'Strict' | 'Lax' | 'None';
interface CookieRecord {
    name: string;
    value: string;
    domain: string;
    path: string;
    expiresAt?: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: CookieSameSite;
    hostOnly: boolean;
}
type StoreCookie = Map<string, Map<string, Map<string, CookieRecord>>>;
export type { CookieSameSite, CookieRecord, StoreCookie };
export declare class Cookies {
    private readonly store;
    constructor(setCookie?: string | CookieRecord | CookieRecord[] | string[], requestURL?: string);
    setCookie(setCookie: string, requestURL: string): void;
    setCookies(setCookies: string[] | undefined, requestURL: string): void;
    getCookies(requestURL: string): CookieRecord[];
    getCookieHeader(requestURL: string): string;
    applyToHeaders(requestURL: string, headers?: Record<string, string>): Record<string, string>;
    deleteCookie(domain: string, path: string, name: string): void;
    cleanup(): void;
    toJSON(): CookieRecord[];
    fromJSON(cookies: CookieRecord[]): void;
}
