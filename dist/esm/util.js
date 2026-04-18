import { Cookies } from './helper/cookies.js';
import { Lapse } from './helper/lapse.js';
const appendURL = (pathURL = '/', baseURL = '') => new URL(pathURL, baseURL).toString();
const isURL = (value) => {
    try {
        new URL(value);
        return true;
    }
    catch {
        return false;
    }
};
const ensureCookies = (instance) => instance.get('/');
function getIDFromURL(url) {
    if (typeof url !== 'string' || !url.trim().length)
        throw new Lapse('URL must be a non-empty string', 'ERROR_INVALID_URL');
    const match = url.match(/\/([A-Z0-9]{8})\.html(?:\?|#|$)/i) ?? url.match(/^https?:\/\/(?:m\.)?zingmp3\.vn\/([^/?#]+)\/?(?:[?#].*)?$/i);
    if (!match?.[1])
        throw new Lapse('Could not extract ID from URL', 'ERROR_INVALID_URL');
    return match[1];
}
function validateOptions(options) {
    const mergedOptions = {
        maxDownRate: 1024 * 1024,
        highWaterMark: 16 * 1024,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        jar: new Cookies(),
        ...options
    };
    if (typeof mergedOptions.maxDownRate !== 'number' ||
        !Number.isFinite(mergedOptions.maxDownRate) ||
        mergedOptions.maxDownRate <= 0)
        throw new Lapse('`maxDownRate` must be a finite number greater than 0.', 'ERROR_INVALID_OPTIONS');
    if (typeof mergedOptions.highWaterMark !== 'number' ||
        !Number.isFinite(mergedOptions.highWaterMark) ||
        mergedOptions.highWaterMark <= 0)
        throw new Lapse('`highWaterMark` must be a finite number greater than 0.', 'ERROR_INVALID_OPTIONS');
    if (typeof mergedOptions.userAgent !== 'string' ||
        !mergedOptions.userAgent.trim().length)
        throw new Lapse('`userAgent` must be a non-empty string.', 'ERROR_INVALID_OPTIONS');
    if (!(mergedOptions.jar instanceof Cookies))
        throw new Lapse('`jar` must be an instance of Cookies.', 'ERROR_INVALID_OPTIONS');
    return mergedOptions;
}
function createArtistRef(data) {
    return {
        id: data.id,
        alias: data.alias,
        name: data.name,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        ...(typeof data.totalFollow === 'number' ? {
            followCount: data.totalFollow
        } : {})
    };
}
function createAlbumItem(data) {
    return {
        id: data.encodeId,
        name: data.title,
        isOffical: data.isoffical,
        releaseDate: data.releaseDate,
        releasedAt: data.releasedAt,
        artists: (data.artists ?? []).map(createArtistRef),
        thumbnail: {
            w165: data.thumbnail
        }
    };
}
function createMedia(data) {
    return {
        id: data.encodeId,
        name: data.title,
        alias: data.alias,
        isOffical: data.isOffical,
        username: data.username,
        artists: (data.artists ?? []).map(createArtistRef),
        isWorldWide: data.isWorldWide,
        thumbnail: {
            w94: data.thumbnail,
            w240: data.thumbnailM
        },
        duration: data.duration,
        isPrivate: data.isPrivate,
        releaseDate: data.releaseDate,
        album: data.album ? createAlbumItem(data.album) : void 0,
        hasLyric: !!data.hasLyric
    };
}
export { appendURL, getIDFromURL, validateOptions, isURL, ensureCookies, createMedia, createArtistRef };
