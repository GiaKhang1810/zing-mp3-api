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
export type { CookieRecord, CookieSameSite, StoreCookie };
