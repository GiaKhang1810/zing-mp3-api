import axios from 'axios';
import m3u8stream from 'm3u8stream';

import { Readable, PassThrough } from 'node:stream';

import { Cookies } from './utils/cookies.js';
import { createSignature } from './utils/encrypt.js';
import { Lapse } from './utils/lapse.js';

import type { AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios';

import type { UriStreaming, UriVideo } from './types/fetch.js';
import type { ClientOptions, RequiredClientOptions, SearchCategory } from './types/index.js';

export type {
    ClientOptions,
    SearchCategory
}

class Client {
    public static readonly BASE_URL: string = 'https://zingmp3.vn';
    public static readonly VERSION_URL: string = '1.6.34';
    public static readonly SECRET_KEY: string = '2aa2d1c561e809b267f3638c4a307aab';
    public static readonly API_KEY: string = '88265e23d4284f25963e6eedac8fbfa3';

    public readonly ctime: string;

    private readonly jar: Cookies;
    private readonly instance: AxiosInstance;

    public maxRate: RequiredClientOptions['maxRate'];

    public constructor(options: ClientOptions = {}) {
        this.maxRate = [
            options?.maxRate?.[0] ?? 100 * 1024,
            options?.maxRate?.[1] ?? 16 * 1024
        ];

        this.ctime = Math.floor(Date.now() / 1000).toString();

        this.jar = new Cookies();

        const axiosOptions: CreateAxiosDefaults<AxiosInstance> = {
            baseURL: Client.BASE_URL,
            params: {
                version: Client.VERSION_URL,
                apiKey: Client.API_KEY,
                ctime: this.ctime
            },
            maxRate: [
                100 * 1024,
                this.maxRate[0]
            ]
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
            if (this.jar.getCookies(Client.BASE_URL).length === 0)
                await this.instance.get('/');

            const response: AxiosResponse<UriVideo> = await this.instance.get(uri, {
                params: {
                    id: videoID,
                    sig: createSignature(uri, 'ctime=' + this.ctime + 'id=' + videoID + 'version=' + Client.VERSION_URL, Client.SECRET_KEY)
                },
                maxRate: [
                    100 * 1024,
                    this.maxRate[0]
                ]
            });

            const body = response.data;

            if (body.err !== 0)
                throw new Lapse(body.msg, 'ERROR_VIDEO_NOT_FOUND');

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

        const uri = '/api/v2/song/get/streaming';

        try {
            if (this.jar.getCookies(Client.BASE_URL).length === 0)
                await this.instance.get('/');

            const response: AxiosResponse<UriStreaming> = await this.instance.get(uri, {
                params: {
                    id: musicID,
                    sig: createSignature(uri, 'ctime=' + this.ctime + 'id=' + musicID + 'version=' + Client.VERSION_URL, Client.SECRET_KEY)
                },
                maxRate: [
                    100 * 1024,
                    this.maxRate[0]
                ]
            });

            const body = response.data;

            if (body.err !== 0)
                throw new Lapse('This song could not be found', 'ERROR_MUSIC_NOT_FOUND');

            const musicURL = body.data?.[128];

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
}

const clientOptions: ClientOptions = {
    maxRate: [
        100 * 1024,
        16 * 1024
    ]
}
const client = new Client(clientOptions);

export {
    client as default,
    client,
    Client
}