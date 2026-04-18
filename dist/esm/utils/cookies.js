function normalizeDomain(domain) {
    return domain.trim().toLowerCase().replace(/^\./, '');
}
function slash(pathname) {
    if (!pathname || pathname[0] !== '/')
        return '/';
    if (pathname === '/')
        return '/';
    const lastSlash = pathname.lastIndexOf('/');
    return lastSlash <= 0 ? '/' : pathname.slice(0, lastSlash);
}
function isExpired(cookie, time) {
    return cookie.expiresAt !== undefined && cookie.expiresAt <= time;
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
export class Cookies {
    store = new Map();
    setCookie(setCookie, requestUrl) {
        const url = new URL(requestUrl);
        const parts = setCookie.split(';').map((part) => part.trim()).filter(Boolean);
        if (parts.length === 0)
            return;
        const [nameValue, ...attributes] = parts;
        const equalsIndex = nameValue.indexOf('=');
        if (equalsIndex <= 0)
            return;
        const name = nameValue.slice(0, equalsIndex).trim();
        const value = stripQuotes(nameValue.slice(equalsIndex + 1).trim());
        let domain = normalizeDomain(url.hostname);
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
                    const normalized = normalizeDomain(attrValue);
                    if (!normalized)
                        break;
                    domain = normalized;
                    hostOnly = false;
                    break;
                }
                case 'path': {
                    path = attrValue && attrValue.startsWith('/') ? attrValue : '/';
                    break;
                }
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
                case 'secure': {
                    secure = true;
                    break;
                }
                case 'httponly': {
                    httpOnly = true;
                    break;
                }
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
    setCookies(setCookies, requestUrl) {
        if (!setCookies?.length)
            return;
        for (const line of setCookies)
            this.setCookie(line, requestUrl);
    }
    getCookies(requestUrl) {
        const url = new URL(requestUrl);
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
    getCookieHeader(requestUrl) {
        return this.getCookies(requestUrl)
            .map(cookie => cookie.name + '=' + cookie.value)
            .join('; ');
    }
    applyToHeaders(requestUrl, headers = {}) {
        const cookie = this.getCookieHeader(requestUrl);
        if (!cookie)
            return headers;
        return {
            ...headers,
            Cookie: cookie
        };
    }
    deleteCookie(domain, path, name) {
        const byPath = this.store.get(normalizeDomain(domain));
        if (!byPath)
            return;
        const byName = byPath.get(path);
        if (!byName)
            return;
        byName.delete(name);
        if (byName.size === 0)
            byPath.delete(path);
        if (byPath.size === 0)
            this.store.delete(normalizeDomain(domain));
    }
    cleanup() {
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
    toJSON() {
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
    fromJSON(cookies) {
        this.store.clear();
        for (const cookie of cookies) {
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
}
