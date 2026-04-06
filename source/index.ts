import axios from 'axios';
import m3u8stream from 'm3u8stream';

import { Readable, PassThrough } from 'node:stream';

import { Cookies } from './utils/cookies.js';
import { createSignature } from './utils/encrypt.js';
import { Lapse } from './utils/lapse.js';

import type { AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios';

import type { ResponseSearch } from './types/fetch/response.js';
import type { Uri } from './types/fetch/uri.js';
import type { ClientOptions, RequiredClientOptions } from './types/index.js';

export type {
    ResponseSearch,

    ClientOptions
}

class ZingClient {
    public static readonly BASE_URL: string = 'https://zingmp3.vn/';

    public static readonly VERSION_URL_V1: string = '1.6.34';
    public static readonly VERSION_URL_V2: string = '1.13.13';

    public static readonly SECRET_KEY_V1: string = '2aa2d1c561e809b267f3638c4a307aab';
    public static readonly SECRET_KEY_V2: string = '10a01dcf33762d3a204cb96429918ff6';

    public static readonly API_KEY_V1: string = '88265e23d4284f25963e6eedac8fbfa3';
    public static readonly API_KEY_V2: string = '38e8643fb0dc04e8d65b99994d3dafff';

    public readonly ctime: string = Math.floor(Date.now() / 1000).toString();

    private readonly jar: Cookies;
    private readonly instance: AxiosInstance;


    public maxRate: RequiredClientOptions['maxRate'];

    public constructor(options: ClientOptions = {}) {
        this.maxRate = [
            options?.maxRate?.[0] ?? 100 * 1024,
            options?.maxRate?.[1] ?? 16 * 1024
        ];

        this.jar = new Cookies();

        const axiosOptions: CreateAxiosDefaults<AxiosInstance> = {
            baseURL: ZingClient.BASE_URL,
            params: {
                version: ZingClient.VERSION_URL_V1,
                apiKey: ZingClient.API_KEY_V1,
                ctime: this.ctime
            },
            maxRate: [
                100 * 1024,
                this.maxRate[0]
            ],
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            }
        }
        this.instance = axios.create(axiosOptions);

        this.instance.interceptors.request.use(
            (options) => {
                const base = options.baseURL ?? '';
                const url = new URL(options.url ?? '/', base).toString();

                const additionalHeaders = this.jar.applyToHeaders(url);
                for (const [key, value] of Object.entries(additionalHeaders))
                    options.headers.set(key, value);

                return options;
            }
        );

        this.instance.interceptors.response.use(
            (response) => {
                const setCookie = response.headers['set-cookie'];
                const requestUrl = response.request?.res?.responseUrl ?? response.config.url;

                if (requestUrl && Array.isArray(setCookie))
                    this.jar.setCookies(setCookie, requestUrl);

                return response;
            }
        );
    }

    public async video(videoID: string): Promise<Readable> {
        if (typeof videoID !== 'string' || !videoID.length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        const uri = '/api/v2/page/get/video';

        try {
            if (this.jar.getCookies(ZingClient.BASE_URL).length === 0)
                void await this.instance.get('/');

            const response: AxiosResponse<Uri.Video> = await this.instance.get(uri, {
                params: {
                    id: videoID,
                    sig: createSignature(uri, 'ctime=' + this.ctime + 'id=' + videoID + 'version=' + ZingClient.VERSION_URL_V1, ZingClient.SECRET_KEY_V1)
                }
            });

            const body = response.data;

            if (body.err !== 0)
                throw new Lapse('Video could not be found', 'ERROR_VIDEO_NOT_FOUND', response.status, body);

            const videoURL = body.data?.streaming?.hls?.['360p'];

            if (!videoURL || !videoURL.length)
                throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');

            const streamVideo = m3u8stream(videoURL);

            streamVideo.once('error',
                (error: unknown): void => {
                    const lapse = new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                    streamVideo.destroy(lapse);
                }
            );

            return streamVideo;
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            throw new Lapse('Failed to fetch video stream', 'ERROR_VIDEO_FETCH', axios.isAxiosError(error) ? error.response?.status : void 0, error);
        }
    }

    public videoSyncLike(videoID: string): Readable {
        const video = new PassThrough({ highWaterMark: this.maxRate[1] });

        void this.video(videoID)
            .then(
                (source: Readable): void => {
                    source.once('error',
                        (error: unknown): void => {
                            const lapse = error instanceof Lapse ? error : new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                            video.destroy(lapse);
                        }
                    );

                    const destroy = (): void => {
                        if (!source.destroyed)
                            source.destroy();
                    }

                    video.once('close', destroy);
                    video.once('error', destroy);

                    source.pipe(video);
                }
            )
            .catch(
                (error: unknown): void => {
                    if (error instanceof Lapse)
                        throw error;

                    throw new Lapse('Failed to fetch video stream', 'ERROR_VIDEO_FETCH', axios.isAxiosError(error) ? error.response?.status : void 0, error);
                }
            );

        return video;
    }

    public async music(musicID: string): Promise<Readable> {
        if (typeof musicID !== 'string' || !musicID.trim().length)
            throw new Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');

        let musicURL: string | undefined;
        const uri = '/api/v2/song/get/streaming';

        try {
            if (this.jar.getCookies(ZingClient.BASE_URL).length === 0)
                void await this.instance.get('/');

            const response: AxiosResponse<Uri.Music> = await this.instance.get(uri, {
                params: {
                    id: musicID,
                    sig: createSignature(uri, 'ctime=' + this.ctime + 'id=' + musicID + 'version=' + ZingClient.VERSION_URL_V1, ZingClient.SECRET_KEY_V1)
                }
            });

            const body = response.data;

            if (body.err === -1150) {
                let retrySuccess = false;
                const uri_v2 = '/api/song/get-song-info';

                for (let step = 0; step < 2; step++) {
                    const retry: AxiosResponse<Uri.Music> = await this.instance.get(uri_v2, {
                        params: {
                            id: musicID,
                            api_key: ZingClient.API_KEY_V2,
                            sig: createSignature('/song/get-song-info', 'ctime=' + this.ctime + 'id=' + musicID, ZingClient.SECRET_KEY_V2),
                            version: void 0,
                            apiKey: void 0
                        }
                    });

                    if (retry.data.err === 0) {
                        retrySuccess = true;
                        musicURL = retry.data.data?.streaming?.default?.[128];
                        break;
                    }
                }

                if (!retrySuccess)
                    throw new Lapse('Music requested by VIP, PRI', 'ERROR_MUSIC_VIP_ONLY', response.status, body);
            } else if (body.err === 0)
                musicURL = body.data?.[128];
            else
                throw new Lapse('This song could not be found', 'ERROR_MUSIC_NOT_FOUND', response.status, body);

            if (!musicURL || !musicURL.length)
                throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');

            const streamMusic: AxiosResponse<Readable> = await this.instance.get(musicURL, { responseType: 'stream' });

            streamMusic.data.once('error',
                (error: unknown): void => {
                    const lapse = new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', streamMusic.status, error);
                    streamMusic.data.destroy(lapse);
                }
            );

            return streamMusic.data;
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            throw new Lapse('Failed to fetch music stream', 'ERROR_MUSIC_FETCH', axios.isAxiosError(error) ? error.response?.status : void 0, error);
        }
    }

    public musicSyncLike(musicID: string): Readable {
        const music = new PassThrough({ highWaterMark: this.maxRate[1] });

        void this.music(musicID)
            .then(
                (source: Readable): void => {
                    source.once('error',
                        (error: unknown): void => {
                            const lapse = error instanceof Lapse ? error : new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
                            music.destroy(lapse);
                        }
                    );

                    const destroy = (): void => {
                        if (!source.destroyed)
                            source.destroy();
                    }

                    music.once('close', destroy);
                    music.once('error', destroy);

                    source.pipe(music);
                }
            )
            .catch(
                (error: unknown): void => {
                    if (error instanceof Lapse)
                        throw error;

                    throw new Lapse('Failed to fetch music stream', 'ERROR_MUSIC_FETCH', axios.isAxiosError(error) ? error.response?.status : void 0, error);
                }
            );

        return music;
    }

    public async search(keyword: string): Promise<ResponseSearch[]> {
        if (typeof keyword !== 'string' || !keyword.trim().length)
            throw new Lapse('Keyword must be a non-empty string', 'ERROR_INVALID_KEYWORD');
        
        const uri = '/api/v2/search/multi';

        try {
            if (this.jar.getCookies(ZingClient.BASE_URL).length === 0)
                void await this.instance.get('/');

            const response: AxiosResponse<Uri.Search> = await this.instance.get(uri, {
                params: {
                    q: keyword,
                    sig: createSignature(uri, 'ctime=' + this.ctime + 'version=' + ZingClient.VERSION_URL_V1, ZingClient.SECRET_KEY_V1)
                }
            });

            const body = response.data;

            if (body.err !== 0)
                throw new Lapse('Could not perform search', 'ERROR_SEARCH_FAILED', response.status, body);

           const songs = body.data?.songs ?? [];

            return songs.map(
                (song): ResponseSearch => ({
                    id: song.encodeId,
                    name: song.title,
                    alias: song.alias,
                    isOffical: song.isOffical,
                    username: song.username,
                    artists: song.artists.map(
                        (artist) => ({
                            id: artist.id,
                            name: artist.name,
                            alias: artist.alias,
                            thumbnail: {
                                w240: artist.thumbnailM,
                                w360: artist.thumbnail
                            }
                        })
                    ),
                    thumbnail: {
                        w94: song.thumbnailM,
                        w240: song.thumbnail
                    },
                    duration: song.duration,
                    releaseDate: song.releaseDate
                })
            );
        } catch (error: unknown) {
            if (error instanceof Lapse)
                throw error;

            throw new Lapse('Failed to perform search', 'ERROR_SEARCH', axios.isAxiosError(error) ? error.response?.status : void 0, error);
        }
    }
}

const clientOptions: ClientOptions = {
    maxRate: [
        100 * 1024,
        16 * 1024
    ]
}
const client = new ZingClient(clientOptions);

export {
    client as default,
    ZingClient
}