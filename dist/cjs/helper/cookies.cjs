'use strict';

var lapse = require('./lapse.cjs');

const normalize = (domain) => domain.trim().toLowerCase().replace(/^\./, '');
const isExpired = (cookie, time) => cookie.expiresAt !== undefined && cookie.expiresAt <= time;
function slash(pathname) {
    if (!pathname || pathname[0] !== '/' || pathname === '/')
        return '/';
    const lastSlash = pathname.lastIndexOf('/');
    return lastSlash <= 0 ? '/' : pathname.slice(0, lastSlash);
}
function domainMatches(hostname, cookieDomain, hostOnly) {
    const host = hostname.toLowerCase();
    const domain = cookieDomain.toLowerCase();
    if (hostOnly)
        return host === domain;
    return host === domain || host.endsWith('.' + domain);
}
function pathMatches(requestPath, cookiePath) {
    if (requestPath === cookiePath)
        return true;
    if (!requestPath.startsWith(cookiePath))
        return false;
    if (cookiePath.endsWith('/'))
        return true;
    return requestPath[cookiePath.length] === '/';
}
function parseExpires(value) {
    const time = Date.parse(value);
    return Number.isNaN(time) ? undefined : time;
}
function stripQuotes(value) {
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"'))
        return value.slice(1, -1);
    return value;
}
function isCookieRecord(value) {
    if (!value || typeof value !== 'object')
        return false;
    const item = value;
    return typeof item.name === 'string' &&
        typeof item.value === 'string' &&
        typeof item.domain === 'string' &&
        typeof item.path === 'string' &&
        typeof item.secure === 'boolean' &&
        typeof item.httpOnly === 'boolean' &&
        typeof item.hostOnly === 'boolean';
}
class Cookies {
    store = new Map();
    constructor(setCookie, requestURL) {
        if (setCookie === undefined)
            return;
        if (typeof setCookie === 'string') {
            if (typeof requestURL !== 'string' || !requestURL.trim().length)
                throw new lapse.Lapse('Request URL must be a non-empty string when setCookie is a string.', 'ERROR_INVALID_URL');
            this.setCookie(setCookie, requestURL);
            return;
        }
        if (Array.isArray(setCookie)) {
            if (!setCookie.length)
                return;
            const isStringArray = setCookie.every((item) => typeof item === 'string');
            const isCookieRecordArray = setCookie.every(isCookieRecord);
            if (isStringArray) {
                if (typeof requestURL !== 'string' || !requestURL.trim().length)
                    throw new lapse.Lapse('Request URL must be a non-empty string when setCookie is a string array.', 'ERROR_INVALID_URL');
                this.setCookies(setCookie, requestURL);
                return;
            }
            if (isCookieRecordArray) {
                this.fromJSON(setCookie);
                return;
            }
            throw new lapse.Lapse('Input array must contain only strings or only cookie records.', 'ERROR_INVALID_COOKIE_INPUT');
        }
        if (isCookieRecord(setCookie)) {
            this.fromJSON([setCookie]);
            return;
        }
        throw new lapse.Lapse('Invalid cookie input.', 'ERROR_INVALID_COOKIE_INPUT');
    }
    setCookie(setCookie, requestURL) {
        try {
            if (typeof setCookie !== 'string' || !setCookie.trim().length)
                throw new lapse.Lapse('Set-Cookie must be a non-empty string.', 'ERROR_INVALID_SET_COOKIE');
            if (typeof requestURL !== 'string' || !requestURL.trim().length)
                throw new lapse.Lapse('Request URL must be a non-empty string.', 'ERROR_INVALID_URL');
            const url = new URL(requestURL);
            const parts = setCookie.split(';').map((part) => part.trim()).filter(Boolean);
            if (parts.length === 0)
                return;
            const [nameValue, ...attributes] = parts;
            const equalsIndex = nameValue.indexOf('=');
            if (equalsIndex <= 0)
                return;
            const name = nameValue.slice(0, equalsIndex).trim();
            const value = stripQuotes(nameValue.slice(equalsIndex + 1).trim());
            let domain = normalize(url.hostname);
            let path = slash(url.pathname);
            let expiresAt;
            let secure = false;
            let httpOnly = false;
            let sameSite;
            let hostOnly = true;
            let maxAge;
            for (const attribute of attributes) {
                const [rawKey, ...rawRest] = attribute.split('=');
                const key = rawKey.trim().toLowerCase();
                const attrValue = rawRest.join('=').trim();
                switch (key) {
                    case 'domain': {
                        if (!attrValue)
                            break;
                        const normalized = normalize(attrValue);
                        if (!normalized)
                            break;
                        domain = normalized;
                        hostOnly = false;
                        break;
                    }
                    case 'path':
                        path = attrValue && attrValue.startsWith('/') ? attrValue : '/';
                        break;
                    case 'expires': {
                        const parsed = parseExpires(attrValue);
                        if (parsed !== undefined)
                            expiresAt = parsed;
                        break;
                    }
                    case 'max-age': {
                        const parsed = Number.parseInt(attrValue, 10);
                        if (!Number.isNaN(parsed))
                            maxAge = parsed;
                        break;
                    }
                    case 'secure':
                        secure = true;
                        break;
                    case 'httponly':
                        httpOnly = true;
                        break;
                    case 'samesite': {
                        const normalized = attrValue.toLowerCase();
                        if (normalized === 'strict')
                            sameSite = 'Strict';
                        else if (normalized === 'lax')
                            sameSite = 'Lax';
                        else if (normalized === 'none')
                            sameSite = 'None';
                        break;
                    }
                    default:
                        break;
                }
            }
            if (!domainMatches(url.hostname, domain, hostOnly))
                return;
            if (maxAge !== undefined)
                expiresAt = maxAge <= 0 ? 0 : Date.now() + maxAge * 1000;
            const cookie = {
                name,
                value,
                domain,
                path,
                expiresAt,
                secure,
                httpOnly,
                sameSite,
                hostOnly
            };
            if (isExpired(cookie, Date.now())) {
                this.deleteCookie(cookie.domain, cookie.path, cookie.name);
                return;
            }
            let byPath = this.store.get(cookie.domain);
            if (!byPath) {
                byPath = new Map();
                this.store.set(cookie.domain, byPath);
            }
            let byName = byPath.get(cookie.path);
            if (!byName) {
                byName = new Map();
                byPath.set(cookie.path, byName);
            }
            byName.set(cookie.name, cookie);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while setting the cookie.';
            throw new lapse.Lapse(message, 'ERROR_SET_COOKIE', undefined, error);
        }
    }
    setCookies(setCookies, requestURL) {
        try {
            if (!setCookies?.length)
                return;
            for (const line of setCookies)
                this.setCookie(line, requestURL);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while setting cookies.';
            throw new lapse.Lapse(message, 'ERROR_SET_COOKIES', undefined, error);
        }
    }
    getCookies(requestURL) {
        try {
            if (typeof requestURL !== 'string' || !requestURL.trim().length)
                throw new lapse.Lapse('Request URL must be a non-empty string.', 'ERROR_INVALID_URL');
            const url = new URL(requestURL);
            const hostname = url.hostname.toLowerCase();
            const pathname = url.pathname || '/';
            const isHttps = url.protocol === 'https:';
            const out = [];
            for (const [, byPath] of this.store) {
                for (const [, byName] of byPath) {
                    for (const [, cookie] of byName) {
                        if (isExpired(cookie, Date.now()))
                            continue;
                        if (cookie.secure && !isHttps)
                            continue;
                        if (!domainMatches(hostname, cookie.domain, cookie.hostOnly))
                            continue;
                        if (!pathMatches(pathname, cookie.path))
                            continue;
                        out.push(cookie);
                    }
                }
            }
            out.sort((a, b) => b.path.length - a.path.length || a.name.localeCompare(b.name));
            return out;
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while getting cookies.';
            throw new lapse.Lapse(message, 'ERROR_GET_COOKIES', undefined, error);
        }
    }
    getCookieHeader(requestURL) {
        try {
            return this.getCookies(requestURL)
                .map(cookie => cookie.name + '=' + cookie.value)
                .join('; ');
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while building the cookie header.';
            throw new lapse.Lapse(message, 'ERROR_GET_COOKIE_HEADER', undefined, error);
        }
    }
    applyToHeaders(requestURL, headers = {}) {
        try {
            const cookie = this.getCookieHeader(requestURL);
            if (!cookie)
                return headers;
            return {
                ...headers,
                Cookie: cookie
            };
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while applying cookies to headers.';
            throw new lapse.Lapse(message, 'ERROR_APPLY_COOKIE_HEADERS', undefined, error);
        }
    }
    deleteCookie(domain, path, name) {
        try {
            if (typeof domain !== 'string' || !domain.trim().length)
                throw new lapse.Lapse('Cookie domain must be a non-empty string.', 'ERROR_INVALID_COOKIE_DOMAIN');
            if (typeof path !== 'string' || !path.trim().length)
                throw new lapse.Lapse('Cookie path must be a non-empty string.', 'ERROR_INVALID_COOKIE_PATH');
            if (typeof name !== 'string' || !name.trim().length)
                throw new lapse.Lapse('Cookie name must be a non-empty string.', 'ERROR_INVALID_COOKIE_NAME');
            const normalizedDomain = normalize(domain);
            const byPath = this.store.get(normalizedDomain);
            if (!byPath)
                return;
            const byName = byPath.get(path);
            if (!byName)
                return;
            byName.delete(name);
            if (byName.size === 0)
                byPath.delete(path);
            if (byPath.size === 0)
                this.store.delete(normalizedDomain);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while deleting the cookie.';
            throw new lapse.Lapse(message, 'ERROR_DELETE_COOKIE', undefined, error);
        }
    }
    cleanup() {
        try {
            const time = Date.now();
            for (const [domain, byPath] of this.store) {
                for (const [path, byName] of byPath) {
                    for (const [name, cookie] of byName) {
                        if (isExpired(cookie, time))
                            byName.delete(name);
                    }
                    if (byName.size === 0)
                        byPath.delete(path);
                }
                if (byPath.size === 0)
                    this.store.delete(domain);
            }
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while cleaning up cookies.';
            throw new lapse.Lapse(message, 'ERROR_COOKIE_CLEANUP', undefined, error);
        }
    }
    toJSON() {
        try {
            this.cleanup();
            const out = [];
            for (const [, byPath] of this.store) {
                for (const [, byName] of byPath) {
                    for (const [, cookie] of byName)
                        out.push({ ...cookie });
                }
            }
            return out;
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while serializing cookies.';
            throw new lapse.Lapse(message, 'ERROR_COOKIE_TO_JSON', undefined, error);
        }
    }
    fromJSON(cookies) {
        try {
            if (!Array.isArray(cookies))
                throw new lapse.Lapse('Cookies must be an array.', 'ERROR_INVALID_COOKIES_JSON');
            this.store.clear();
            for (const cookie of cookies) {
                if (!cookie ||
                    typeof cookie.name !== 'string' ||
                    typeof cookie.value !== 'string' ||
                    typeof cookie.domain !== 'string' ||
                    typeof cookie.path !== 'string' ||
                    typeof cookie.secure !== 'boolean' ||
                    typeof cookie.httpOnly !== 'boolean' ||
                    typeof cookie.hostOnly !== 'boolean')
                    throw new lapse.Lapse('Invalid cookie record in JSON input.', 'ERROR_INVALID_COOKIE_RECORD');
                if (isExpired(cookie, Date.now()))
                    continue;
                let byPath = this.store.get(cookie.domain);
                if (!byPath) {
                    byPath = new Map();
                    this.store.set(cookie.domain, byPath);
                }
                let byName = byPath.get(cookie.path);
                if (!byName) {
                    byName = new Map();
                    byPath.set(cookie.path, byName);
                }
                byName.set(cookie.name, { ...cookie });
            }
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error
                ? error.message
                : 'An unknown error occurred while restoring cookies from JSON.';
            throw new lapse.Lapse(message, 'ERROR_COOKIE_FROM_JSON', undefined, error);
        }
    }
}

exports.Cookies = Cookies;
