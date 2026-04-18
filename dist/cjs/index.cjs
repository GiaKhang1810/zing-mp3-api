'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var axios = require('axios');
var m3u8stream = require('m3u8stream');
var node_stream = require('node:stream');
var cookies = require('./utils/cookies.cjs');
var encrypt = require('./utils/encrypt.cjs');
var lapse = require('./utils/lapse.cjs');
var refined = require('./utils/refined.cjs');

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
class Client {
    static BASE_URL = 'https://zingmp3.vn/';
    static VERSION_URL_V1 = '1.6.34';
    static VERSION_URL_V2 = '1.10.49';
    static VERSION_URL_V3 = '1.13.13';
    static SECRET_KEY_V1 = '2aa2d1c561e809b267f3638c4a307aab';
    static SECRET_KEY_V2 = 'acOrvUS15XRW2o9JksiK1KgQ6Vbds8ZW';
    static SECRET_KEY_V3 = '10a01dcf33762d3a204cb96429918ff6';
    static API_KEY_V1 = '88265e23d4284f25963e6eedac8fbfa3';
    static API_KEY_V2 = 'X5BM3w8N7MKozC0B85o4KMlzLZKhV00y';
    static API_KEY_V3 = '38e8643fb0dc04e8d65b99994d3dafff';
    static API_VIDEO_PATH = '/api/v2/page/get/video';
    static API_MUSIC_PATH = '/api/v2/song/get/streaming';
    static EXTRA_API_MUSIC_PATH = '/api/song/get-song-info';
    static API_SEARCH_PATH = '/api/v2/search';
    static API_PLAYLIST_PATH = '/api/v2/page/get/playlist';
    static API_MEDIA_DETAILS_PATH = '/api/v2/song/get/info';
    static API_ARTIST_PATH = '/api/v2/page/get/artist';
    static API_ARTIST_MEDIA_LIST_PATH = '/api/v2/song/get/list';
    static API_RELEASE_CHART_PATH = '/api/v2/page/get/newrelease-chart';
    static getIDFromURL(url) {
        if (typeof url !== 'string' || !url.trim().length)
            throw new lapse.Lapse('URL must be a non-empty string', 'ERROR_INVALID_URL');
        const match = url.match(/\/([A-Z0-9]{8})\.html(?:\?|#|$)/i) || url.match(/^https?:\/\/(?:m\.)?zingmp3\.vn\/([^/?#]+)\/?(?:[?#].*)?$/i);
        if (!match)
            throw new lapse.Lapse('Could not extract ID from URL', 'ERROR_INVALID_URL');
        return match[1];
    }
    ctime = Math.floor(Date.now() / 1000).toString();
    instance;
    maxLoad;
    maxHighWaterMark;
    userAgent;
    jar;
    constructor(options) {
        const mergedOptions = {
            maxLoad: 1024 * 1024,
            maxHighWaterMark: 16 * 1024,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            jar: new cookies.Cookies(),
            ...options
        };
        this.maxLoad = mergedOptions.maxLoad;
        this.maxHighWaterMark = mergedOptions.maxHighWaterMark;
        this.userAgent = mergedOptions.userAgent;
        this.jar = mergedOptions.jar;
        this.instance = axios.create({
            baseURL: Client.BASE_URL,
            params: {
                version: Client.VERSION_URL_V1,
                apiKey: Client.API_KEY_V1,
                ctime: this.ctime
            },
            maxRate: this.maxLoad
        });
        this.instance.interceptors.request.use((options) => {
            const baseURL = options.baseURL ?? '';
            const url = new URL(options.url ?? '/', baseURL).toString();
            const cookie = this.jar.getCookieHeader(url);
            options.headers.set('User-Agent', this.userAgent);
            options.headers.set('Cookie', cookie);
            return options;
        });
        this.instance.interceptors.response.use((response) => {
            const setCookie = response.headers['set-cookie'];
            const requestURL = response.request?.res?.responseUrl ?? response.config.url;
            if (requestURL && Array.isArray(setCookie))
                this.jar.setCookies(setCookie, requestURL);
            return response.data;
        });
    }
    getJar() {
        return this.jar;
    }
    setOptions(options) {
        const mergedOptions = {
            maxLoad: this.maxLoad,
            maxHighWaterMark: this.maxHighWaterMark,
            userAgent: this.userAgent,
            jar: this.jar,
            ...options
        };
        this.maxLoad = mergedOptions.maxLoad;
        this.maxHighWaterMark = mergedOptions.maxHighWaterMark;
        this.userAgent = mergedOptions.userAgent;
        this.jar = mergedOptions.jar;
        this.instance.defaults.maxRate = mergedOptions.maxLoad;
    }
    async video(videoID) {
        const value = videoID instanceof URL ? videoID.toString() : videoID;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_VIDEO_PATH, {
                params: {
                    id,
                    sig: encrypt.createSignature(Client.API_VIDEO_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            if (response.err !== 0)
                throw new lapse.Lapse('Video could not be found', 'ERROR_VIDEO_NOT_FOUND', response.err);
            const videoURL = response.data?.streaming?.hls?.['720p'] || response.data?.streaming?.hls?.['360p'];
            if (!videoURL || !videoURL.length)
                throw new lapse.Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');
            const source = m3u8stream(videoURL, {
                highWaterMark: this.maxHighWaterMark
            });
            source.once('error', (error) => {
                const lapse$1 = new lapse.Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                source.destroy(lapse$1);
            });
            return source;
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
        }
    }
    videoSync(videoID) {
        const video = new node_stream.PassThrough({ highWaterMark: this.maxHighWaterMark });
        let copySource;
        let closed = false;
        let sourceDestroyed = false;
        const destroy = () => {
            if (!copySource || sourceDestroyed)
                return;
            sourceDestroyed = true;
            if (!copySource)
                return;
            copySource.unpipe(video);
            if (!copySource.destroyed)
                copySource.destroy();
        };
        const closer = () => {
            closed = true;
            destroy();
        };
        video.once('close', closer);
        video.once('error', closer);
        void this.video(videoID)
            .then((source) => {
            copySource = source;
            source.once('error', (error) => {
                if (error instanceof lapse.Lapse) {
                    video.destroy(error);
                    return;
                }
                const message = error instanceof Error ? error.message : 'An unknown error occurred while downloading stream';
                const lapse$1 = new lapse.Lapse(message, 'ERROR_STREAM_DOWNLOAD', void 0, error);
                video.destroy(lapse$1);
            });
            if (closed || video.destroyed) {
                destroy();
                return;
            }
            source.pipe(video);
        })
            .catch((error) => {
            if (error instanceof lapse.Lapse) {
                video.destroy(error);
                return;
            }
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            const lapse$1 = new lapse.Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
            video.destroy(lapse$1);
        });
        return video;
    }
    async music(musicID) {
        const value = musicID instanceof URL ? musicID.toString() : musicID;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_MUSIC_PATH, {
                params: {
                    id,
                    sig: encrypt.createSignature(Client.API_MUSIC_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            let musicURL = response.data?.[320] && response.data[320] !== 'VIP' ? response.data[320] : response.data?.[128];
            if (response.err === -1150) {
                const retry = async (step, before) => {
                    if (step > 3)
                        throw new lapse.Lapse('Music requested by VIP, PRI', 'ERROR_MUSIC_VIP_ONLY', void 0, before ? before.err : void 0);
                    const retryData = await this.instance.get(Client.EXTRA_API_MUSIC_PATH, {
                        params: {
                            id,
                            api_key: Client.API_KEY_V3,
                            sig: encrypt.createSignature('/song/get-song-info', {
                                ctime: this.ctime,
                                id
                            }, Client.SECRET_KEY_V3),
                            version: void 0,
                            apiKey: void 0
                        }
                    });
                    if (retryData.err === 0)
                        return retryData.data?.streaming?.default?.[128];
                    return retry(step + 1, retryData);
                };
                musicURL = await retry(0);
            }
            if (!musicURL || !musicURL.trim().length)
                throw new lapse.Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');
            const source = await this.instance.get(musicURL, { responseType: 'stream' });
            source.once('error', (error) => {
                const lapse$1 = new lapse.Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                source.destroy(lapse$1);
            });
            return source;
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_MUSIC_FETCH', void 0, error);
        }
    }
    musicSync(musicID) {
        const music = new node_stream.PassThrough({ highWaterMark: this.maxHighWaterMark });
        let copySource;
        let closed = false;
        let sourceDestroyed = false;
        const destroy = () => {
            if (!copySource || sourceDestroyed)
                return;
            sourceDestroyed = true;
            copySource.unpipe(music);
            if (!copySource.destroyed)
                copySource.destroy();
        };
        const closer = () => {
            closed = true;
            destroy();
        };
        music.once('close', closer);
        music.once('error', closer);
        void this.music(musicID)
            .then((source) => {
            copySource = source;
            source.once('error', (error) => {
                if (error instanceof lapse.Lapse) {
                    music.destroy(error);
                    return;
                }
                const message = error instanceof Error ? error.message : 'An unknown error occurred while downloading stream.';
                const lapse$1 = new lapse.Lapse(message, 'ERROR_STREAM_DOWNLOAD', void 0, error);
                music.destroy(lapse$1);
            });
            if (closed || music.destroyed) {
                destroy();
                return;
            }
            source.pipe(music);
        })
            .catch((error) => {
            if (error instanceof lapse.Lapse) {
                music.destroy(error);
                return;
            }
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            const lapse$1 = new lapse.Lapse(message, 'ERROR_MUSIC_FETCH', void 0, error);
            music.destroy(lapse$1);
        });
        return music;
    }
    async playlist(playlistID) {
        const value = playlistID instanceof URL ? playlistID.toString() : playlistID;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        try {
            playlistID = isURL(value) ? Client.getIDFromURL(value) : value;
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_PLAYLIST_PATH, {
                params: {
                    id: playlistID,
                    sig: encrypt.createSignature(Client.API_PLAYLIST_PATH, {
                        ctime: this.ctime,
                        id: playlistID,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            if (response.err !== 0)
                throw new lapse.Lapse('Could not find playlist', 'ERROR_PLAYLIST_NOT_FOUND', response.err, response);
            return refined.createPlayList(response.data);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_PLAYLIST_FETCH', void 0, error);
        }
    }
    async artist(aliasID) {
        const value = aliasID instanceof URL ? aliasID.toString() : aliasID;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        try {
            aliasID = isURL(value) ? Client.getIDFromURL(value) : value;
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_ARTIST_PATH, {
                params: {
                    alias: aliasID,
                    sig: encrypt.createSignature(Client.API_ARTIST_PATH, {
                        ctime: this.ctime,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            if (response.err === -108)
                throw new lapse.Lapse('Artist not found', 'ERROR_ARTIST_NOT_FOUND', response.err);
            if (response.err !== 0)
                throw new lapse.Lapse('Could not fetch artist', 'ERROR_ARTIST_FETCH', response.err);
            const mediaList = await this.instance.get(Client.API_ARTIST_MEDIA_LIST_PATH, {
                params: {
                    id: response.data.id,
                    type: 'artist',
                    page: 1,
                    count: 0,
                    sort: 'listen',
                    sectionId: 'aSong',
                    apiKey: Client.API_KEY_V2,
                    version: Client.VERSION_URL_V2,
                    sig: encrypt.createSignature(Client.API_ARTIST_MEDIA_LIST_PATH, {
                        count: 0,
                        ctime: this.ctime,
                        id: response.data.id,
                        page: 1,
                        type: 'artist',
                        version: Client.VERSION_URL_V2
                    }, Client.SECRET_KEY_V2)
                }
            });
            return refined.createArtist(response.data, mediaList.data);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_ARTIST_FETCH', void 0, error);
        }
    }
    async mediaDetails(mediaID) {
        const value = mediaID instanceof URL ? mediaID.toString() : mediaID;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_MEDIA_DETAILS_PATH, {
                params: {
                    id,
                    sig: encrypt.createSignature(Client.API_MEDIA_DETAILS_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            if (response.err === -1023)
                throw new lapse.Lapse('Media not found', 'ERROR_MEDIA_NOT_FOUND', response.err);
            if (response.err !== 0)
                throw new lapse.Lapse('Could not fetch media', 'ERROR_MEDIA_FETCH', response.err);
            return refined.createMedia(response.data);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_MEDIA_FETCH', void 0, error);
        }
    }
    async releaseChart() {
        try {
            void await ensureCookies(this.instance);
            const response = await this.instance.get(Client.API_RELEASE_CHART_PATH, {
                params: {
                    sig: encrypt.createSignature(Client.API_RELEASE_CHART_PATH, {
                        ctime: this.ctime,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });
            if (response.err !== 0)
                throw new lapse.Lapse('Release chart could not be fetched', 'ERROR_RELEASE_CHART_FETCH', response.err);
            return response.data.items.map(refined.createMediaChart);
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_RELEASE_CHART_FETCH', void 0, error);
        }
    }
    async search(query, type) {
        if (typeof query !== 'string' || !query.trim().length)
            throw new lapse.Lapse('Query must be a non-empty string', 'ERROR_INVALID_QUERY');
        if (typeof type !== 'string' || !type.trim().length)
            throw new lapse.Lapse('Type must be a non-empty string', 'ERROR_INVALID_TYPE');
        if (!['music', 'video', 'artist', 'playlist'].includes(type))
            throw new lapse.Lapse('Type not supported.', 'ERROR_INVALID_TYPE');
        try {
            void await ensureCookies(this.instance);
            let params;
            switch (type) {
                case 'music':
                    params = {
                        q: query,
                        type: 'song',
                        page: 1,
                        count: 20,
                        sig: encrypt.createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'song',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    };
                    break;
                case 'video':
                    params = {
                        q: query,
                        type: 'video',
                        page: 1,
                        count: 20,
                        sig: encrypt.createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'video',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    };
                    break;
                case 'artist':
                    params = {
                        q: query,
                        type: 'artist',
                        page: 1,
                        count: 20,
                        sig: encrypt.createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'artist',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    };
                    break;
                case 'playlist':
                    params = {
                        q: query,
                        type: 'playlist',
                        page: 1,
                        count: 20,
                        sig: encrypt.createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'playlist',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    };
                    break;
            }
            const response = await this.instance.get(Client.API_SEARCH_PATH, { params });
            if (response.err !== 0)
                throw new lapse.Lapse('Search could not be fetched', 'ERROR_SEARCH_FAILED', response.err);
            const items = response.data.items ?? [];
            switch (type) {
                case 'music':
                    return items.map(refined.createSearchMedia);
                case 'video':
                    return items.map(refined.createSearchMedia);
                case 'artist':
                    return items.map(refined.createSearchArtist);
                case 'playlist':
                    return items.map(refined.createSearchPlayList);
            }
        }
        catch (error) {
            if (error instanceof lapse.Lapse)
                throw error;
            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new lapse.Lapse(message, 'ERROR_SEARCH_FETCH', void 0, error);
        }
    }
}
const client = new Client();

exports.Cookies = cookies.Cookies;
exports.createSignature = encrypt.createSignature;
exports.Lapse = lapse.Lapse;
exports.Client = Client;
exports.default = client;
