import axios from 'axios';
import m3u8stream from 'm3u8stream';

import { PassThrough } from 'node:stream';

import { Cookies } from './utils/cookies.js';
import { createSignature } from './utils/encrypt.js';
import { Lapse } from './utils/lapse.js';
import { createArtist, createMedia, createSearchMedia, createPlayList, createSearchArtist, createSearchPlayList, createMediaChart } from './utils/refined.js';

import type { AxiosInstance } from 'axios';
import type { Readable } from 'node:stream';
import type { ClientOptions } from './types/client.js';
import type { RawArtist, RawMedia, RawMediaChart, RawMusic, RawPlayList, RawPlayListSong, RawSearch, RawSearchArtist, RawSearchMedia, RawSearchObj, RawSearchPlayList, RawVideo, ResponseData } from './types/raw.js';
import type { Artist, Media, PlayList } from './utils/refined.js';
import type { MediaChart, ParamSearch, SearchObj } from './types/response.js';

export type * from './types/index.js';

const isURL = (value: string): boolean => {
    try {
        new URL(value);
        return true;
    } catch {
        return false;
    }
}

const ensureCookies = (instance: AxiosInstance): Promise<void> => instance.get('/');

class Client {
    public static readonly BASE_URL: string = 'https://zingmp3.vn/';

    public static readonly VERSION_URL_V1: string = '1.6.34';
    public static readonly VERSION_URL_V2: string = '1.10.49';
    public static readonly VERSION_URL_V3: string = '1.13.13';

    public static readonly SECRET_KEY_V1: string = '2aa2d1c561e809b267f3638c4a307aab';
    public static readonly SECRET_KEY_V2: string = 'acOrvUS15XRW2o9JksiK1KgQ6Vbds8ZW';
    public static readonly SECRET_KEY_V3: string = '10a01dcf33762d3a204cb96429918ff6';

    public static readonly API_KEY_V1: string = '88265e23d4284f25963e6eedac8fbfa3';
    public static readonly API_KEY_V2: string = 'X5BM3w8N7MKozC0B85o4KMlzLZKhV00y';
    public static readonly API_KEY_V3: string = '38e8643fb0dc04e8d65b99994d3dafff';

    public static readonly API_VIDEO_PATH: string = '/api/v2/page/get/video';
    public static readonly API_MUSIC_PATH: string = '/api/v2/song/get/streaming';
    public static readonly EXTRA_API_MUSIC_PATH: string = '/api/song/get-song-info';
    public static readonly API_SEARCH_PATH: string = '/api/v2/search';
    public static readonly API_PLAYLIST_PATH: string = '/api/v2/page/get/playlist';
    public static readonly API_MEDIA_DETAILS_PATH: string = '/api/v2/song/get/info';
    public static readonly API_ARTIST_PATH: string = '/api/v2/page/get/artist';
    public static readonly API_ARTIST_MEDIA_LIST_PATH: string = '/api/v2/song/get/list';
    public static readonly API_RELEASE_CHART_PATH: string = '/api/v2/page/get/newrelease-chart';

    public static getIDFromURL(url: string): string {
        if (typeof url !== 'string' || !url.trim().length)
            throw new Lapse('URL must be a non-empty string', 'ERROR_INVALID_URL');

        const match: RegExpMatchArray | null = url.match(/\/([A-Z0-9]{8})\.html(?:\?|#|$)/i) || url.match(/^https?:\/\/(?:m\.)?zingmp3\.vn\/([^/?#]+)\/?(?:[?#].*)?$/i);

        if (!match)
            throw new Lapse('Could not extract ID from URL', 'ERROR_INVALID_URL');

        return match[1];
    }

    private readonly ctime: string = Math.floor(Date.now() / 1000).toString();
    private readonly instance: AxiosInstance;

    private maxLoad: number;
    private maxHighWaterMark: number;
    private userAgent: string;
    private jar: Cookies;

    public constructor(options?: ClientOptions) {
        const mergedOptions: Required<ClientOptions> = {
            maxLoad: 1024 * 1024,
            maxHighWaterMark: 16 * 1024,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
            jar: new Cookies(),
            ...options
        }

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

        this.instance.interceptors.request.use(
            (options) => {
                const baseURL = options.baseURL ?? '';
                const url = new URL(options.url ?? '/', baseURL).toString();
                const cookie = this.jar.getCookieHeader(url);

                options.headers.set('User-Agent', this.userAgent);
                options.headers.set('Cookie', cookie);

                return options;
            }
        );

        this.instance.interceptors.response.use(
            (response) => {
                const setCookie = response.headers['set-cookie'];
                const requestURL: string | void = response.request?.res?.responseUrl ?? response.config.url;

                if (
                    requestURL && Array.isArray(setCookie)
                ) this.jar.setCookies(setCookie, requestURL);

                return response.data;
            }
        );
    }

    public getJar(): Cookies {
        return this.jar;
    }

    public setOptions(options?: ClientOptions): void {
        const mergedOptions: Required<ClientOptions> = {
            maxLoad: this.maxLoad,
            maxHighWaterMark: this.maxHighWaterMark,
            userAgent: this.userAgent,
            jar: this.jar,
            ...options
        }

        this.maxLoad = mergedOptions.maxLoad;
        this.maxHighWaterMark = mergedOptions.maxHighWaterMark;
        this.userAgent = mergedOptions.userAgent;
        this.jar = mergedOptions.jar;

        this.instance.defaults.maxRate = mergedOptions.maxLoad;
    }

    public async video(videoID: string | URL): Promise<Readable> {
        const value = videoID instanceof URL ? videoID.toString() : videoID;

        if (typeof value !== 'string' || !value.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;

            void await ensureCookies(this.instance);

            const response: ResponseData<RawVideo> = await this.instance.get(Client.API_VIDEO_PATH, {
                params: {
                    id,
                    sig: createSignature(Client.API_VIDEO_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            if (response.err !== 0)
                throw new Lapse('Video could not be found', 'ERROR_VIDEO_NOT_FOUND', response.err);

            const videoURL: string | void = response.data?.streaming?.hls?.['720p'] || response.data?.streaming?.hls?.['360p'];

            if (!videoURL || !videoURL.length)
                throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');

            const source = m3u8stream(videoURL, {
                highWaterMark: this.maxHighWaterMark
            });

            source.once('error',
                (error: unknown): void => {
                    const lapse = new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                    source.destroy(lapse);
                }
            );

            return source;
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
        }
    }

    public videoSync(videoID: string | URL): Readable {
        const video = new PassThrough({ highWaterMark: this.maxHighWaterMark });

        let copySource: Readable | undefined;
        let closed = false;
        let sourceDestroyed = false;

        const destroy = (): void => {
            if (!copySource || sourceDestroyed)
                return;

            sourceDestroyed = true;

            if (!copySource)
                return;

            copySource.unpipe(video);

            if (!copySource.destroyed)
                copySource.destroy();
        }

        const closer = (): void => {
            closed = true;
            destroy();
        }

        video.once('close', closer);
        video.once('error', closer);

        void this.video(videoID)
            .then(
                (source: Readable): void => {
                    copySource = source;

                    source.once('error',
                        (error: unknown): void => {
                            if (error instanceof Lapse) {
                                video.destroy(error);
                                return;
                            }

                            const message = error instanceof Error ? error.message : 'An unknown error occurred while downloading stream';
                            const lapse = new Lapse(message, 'ERROR_STREAM_DOWNLOAD', void 0, error);
                            video.destroy(lapse);
                        }
                    );

                    if (closed || video.destroyed) {
                        destroy();
                        return;
                    }

                    source.pipe(video);
                }
            )
            .catch(
                (error: unknown): void => {
                    if (error instanceof Lapse) {
                        video.destroy(error);
                        return;
                    }

                    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
                    const lapse = new Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
                    video.destroy(lapse);
                }
            );

        return video;
    }

    public async music(musicID: string | URL): Promise<Readable> {
        const value = musicID instanceof URL ? musicID.toString() : musicID;

        if (typeof value !== 'string' || !value.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;

            void await ensureCookies(this.instance);

            const response: ResponseData<RawMusic> = await this.instance.get(Client.API_MUSIC_PATH, {
                params: {
                    id,
                    sig: createSignature(Client.API_MUSIC_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            let musicURL: string | void = response.data?.[320] && response.data[320] !== 'VIP' ? response.data[320] : response.data?.[128];

            if (response.err === -1150) {
                const retry = async (step: number, before?: ResponseData<RawMusic>): Promise<string | void> => {
                    if (step > 3)
                        throw new Lapse('Music requested by VIP, PRI', 'ERROR_MUSIC_VIP_ONLY', void 0, before ? before.err : void 0);

                    const retryData: ResponseData<RawMusic> = await this.instance.get(Client.EXTRA_API_MUSIC_PATH, {
                        params: {
                            id,
                            api_key: Client.API_KEY_V3,
                            sig: createSignature('/song/get-song-info', {
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
                }

                musicURL = await retry(0);
            }

            if (!musicURL || !musicURL.trim().length)
                throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');

            const source: Readable = await this.instance.get(musicURL, { responseType: 'stream' });

            source.once('error',
                (error: unknown): void => {
                    const lapse = new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                    source.destroy(lapse);
                }
            );

            return source;
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_MUSIC_FETCH', void 0, error);
        }
    }

    public musicSync(musicID: string | URL): Readable {
        const music = new PassThrough({ highWaterMark: this.maxHighWaterMark });

        let copySource: Readable | undefined;
        let closed = false;
        let sourceDestroyed = false;

        const destroy = (): void => {
            if (!copySource || sourceDestroyed)
                return;

            sourceDestroyed = true;
            copySource.unpipe(music);

            if (!copySource.destroyed)
                copySource.destroy();
        }

        const closer = (): void => {
            closed = true;
            destroy();
        }

        music.once('close', closer);
        music.once('error', closer);

        void this.music(musicID)
            .then(
                (source: Readable): void => {
                    copySource = source;

                    source.once('error',
                        (error: unknown): void => {
                            if (error instanceof Lapse) {
                                music.destroy(error);
                                return;
                            }

                            const message = error instanceof Error ? error.message : 'An unknown error occurred while downloading stream.';
                            const lapse = new Lapse(message, 'ERROR_STREAM_DOWNLOAD', void 0, error);
                            music.destroy(lapse);
                        }
                    );

                    if (closed || music.destroyed) {
                        destroy();
                        return;
                    }

                    source.pipe(music);
                }
            )
            .catch(
                (error: unknown): void => {
                    if (error instanceof Lapse) {
                        music.destroy(error);
                        return;
                    }

                    const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
                    const lapse = new Lapse(message, 'ERROR_MUSIC_FETCH', void 0, error);
                    music.destroy(lapse);
                }
            );

        return music;
    }

    public async playlist(playlistID: string | URL): Promise<PlayList> {
        const value = playlistID instanceof URL ? playlistID.toString() : playlistID;

        if (typeof value !== 'string' || !value.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        try {
            playlistID = isURL(value) ? Client.getIDFromURL(value) : value;

            void await ensureCookies(this.instance);

            const response: ResponseData<RawPlayList> = await this.instance.get(Client.API_PLAYLIST_PATH, {
                params: {
                    id: playlistID,
                    sig: createSignature(Client.API_PLAYLIST_PATH, {
                        ctime: this.ctime,
                        id: playlistID,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            if (response.err !== 0)
                throw new Lapse('Could not find playlist', 'ERROR_PLAYLIST_NOT_FOUND', response.err, response);

            return createPlayList(response.data);
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_PLAYLIST_FETCH', void 0, error);
        }
    }

    public async artist(aliasID: string | URL): Promise<Artist> {
        const value = aliasID instanceof URL ? aliasID.toString() : aliasID;

        if (typeof value !== 'string' || !value.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        try {
            aliasID = isURL(value) ? Client.getIDFromURL(value) : value;

            void await ensureCookies(this.instance);

            const response: ResponseData<RawArtist> = await this.instance.get(Client.API_ARTIST_PATH, {
                params: {
                    alias: aliasID,
                    sig: createSignature(Client.API_ARTIST_PATH, {
                        ctime: this.ctime,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            if (response.err === -108)
                throw new Lapse('Artist not found', 'ERROR_ARTIST_NOT_FOUND', response.err);

            if (response.err !== 0)
                throw new Lapse('Could not fetch artist', 'ERROR_ARTIST_FETCH', response.err);

            const mediaList: ResponseData<RawPlayListSong> = await this.instance.get(Client.API_ARTIST_MEDIA_LIST_PATH, {
                params: {
                    id: response.data.id,
                    type: 'artist',
                    page: 1,
                    count: 0,
                    sort: 'listen',
                    sectionId: 'aSong',
                    apiKey: Client.API_KEY_V2,
                    version: Client.VERSION_URL_V2,
                    sig: createSignature(Client.API_ARTIST_MEDIA_LIST_PATH, {
                        count: 0,
                        ctime: this.ctime,
                        id: response.data.id,
                        page: 1,
                        type: 'artist',
                        version: Client.VERSION_URL_V2
                    }, Client.SECRET_KEY_V2)
                }
            });

            return createArtist(response.data, mediaList.data);
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_ARTIST_FETCH', void 0, error);
        }
    }

    public async mediaDetails(mediaID: string | URL): Promise<Media> {
        const value = mediaID instanceof URL ? mediaID.toString() : mediaID;

        if (typeof value !== 'string' || !value.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        try {
            const id = isURL(value) ? Client.getIDFromURL(value) : value;

            void await ensureCookies(this.instance);

            const response: ResponseData<RawMedia> = await this.instance.get(Client.API_MEDIA_DETAILS_PATH, {
                params: {
                    id,
                    sig: createSignature(Client.API_MEDIA_DETAILS_PATH, {
                        ctime: this.ctime,
                        id,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            if (response.err === -1023)
                throw new Lapse('Media not found', 'ERROR_MEDIA_NOT_FOUND', response.err);

            if (response.err !== 0)
                throw new Lapse('Could not fetch media', 'ERROR_MEDIA_FETCH', response.err);

            return createMedia(response.data);
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_MEDIA_FETCH', void 0, error);
        }
    }

    public async releaseChart(): Promise<MediaChart[]> {
        try {
            void await ensureCookies(this.instance);

            const response: ResponseData<RawSearch<RawMediaChart>> = await this.instance.get(Client.API_RELEASE_CHART_PATH, {
                params: {
                    sig: createSignature(Client.API_RELEASE_CHART_PATH, {
                        ctime: this.ctime,
                        version: Client.VERSION_URL_V1
                    }, Client.SECRET_KEY_V1)
                }
            });

            if (response.err !== 0)
                throw new Lapse('Release chart could not be fetched', 'ERROR_RELEASE_CHART_FETCH', response.err);

            return response.data.items.map(createMediaChart);
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_RELEASE_CHART_FETCH', void 0, error);
        }
    }

    public async search<T extends keyof SearchObj>(query: string, type: T): Promise<SearchObj[T][]> {
        if (typeof query !== 'string' || !query.trim().length)
            throw new Lapse('Query must be a non-empty string', 'ERROR_INVALID_QUERY');

        if (typeof type !== 'string' || !type.trim().length)
            throw new Lapse('Type must be a non-empty string', 'ERROR_INVALID_TYPE');

        if (!['music', 'video', 'artist', 'playlist'].includes(type))
            throw new Lapse('Type not supported.', 'ERROR_INVALID_TYPE');

        try {
            void await ensureCookies(this.instance);

            let params: ParamSearch;
            switch (type) {
                case 'music':
                    params = {
                        q: query,
                        type: 'song',
                        page: 1,
                        count: 20,
                        sig: createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'song',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    }
                    break;
                case 'video':
                    params = {
                        q: query,
                        type: 'video',
                        page: 1,
                        count: 20,
                        sig: createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'video',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    }
                    break;
                case 'artist':
                    params = {
                        q: query,
                        type: 'artist',
                        page: 1,
                        count: 20,
                        sig: createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'artist',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    }
                    break;
                case 'playlist':
                    params = {
                        q: query,
                        type: 'playlist',
                        page: 1,
                        count: 20,
                        sig: createSignature(Client.API_SEARCH_PATH, {
                            count: 20,
                            ctime: this.ctime,
                            page: 1,
                            type: 'playlist',
                            version: Client.VERSION_URL_V1
                        }, Client.SECRET_KEY_V1)
                    }
                    break;
            }

            const response: ResponseData<RawSearch<RawSearchObj[T]>> = await this.instance.get(Client.API_SEARCH_PATH, { params });

            if (response.err !== 0)
                throw new Lapse('Search could not be fetched', 'ERROR_SEARCH_FAILED', response.err);

            const items = response.data.items ?? [];

            switch (type) {
                case 'music':
                    return (items as RawSearchObj['music'][]).map(createSearchMedia) as SearchObj[T][];
                case 'video':
                    return (items as RawSearchObj['video'][]).map(createSearchMedia) as SearchObj[T][];
                case 'artist':
                    return (items as RawSearchObj['artist'][]).map(createSearchArtist) as SearchObj[T][];
                case 'playlist':
                    return (items as RawSearchObj['playlist'][]).map(createSearchPlayList) as SearchObj[T][];
            }
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
            throw new Lapse(message, 'ERROR_SEARCH_FETCH', void 0, error);
        }
    }
}

const client = new Client();

export {
    client as default,

    Cookies,
    Client,
    Lapse,

    createSignature
}