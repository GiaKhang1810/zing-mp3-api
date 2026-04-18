import { Cookies } from './helper/cookies.js';
import type { Data } from './core/type.js';
interface ClientOptions {
    maxDownRate?: number;
    highWaterMark?: number;
    userAgent?: string;
    jar?: Cookies;
}
export type { ClientOptions };
declare class Client {
    static readonly BASE_URL: string;
    static readonly VERSION_URL_V1: string;
    static readonly VERSION_URL_V2: string;
    static readonly VERSION_URL_V3: string;
    static readonly SECRET_KEY_V1: string;
    static readonly SECRET_KEY_V2: string;
    static readonly SECRET_KEY_V3: string;
    static readonly API_KEY_V1: string;
    static readonly API_KEY_V2: string;
    static readonly API_KEY_V3: string;
    static readonly API_VIDEO_PATH: string;
    static readonly API_MUSIC_PATH: string;
    static readonly EXTRA_API_MUSIC_PATH: string;
    static readonly API_SEARCH_PATH: string;
    static readonly API_ALBUM_PATH: string;
    static readonly API_MEDIA_DETAILS_PATH: string;
    static readonly API_ARTIST_PATH: string;
    static readonly API_ARTIST_MEDIA_LIST_PATH: string;
    static readonly API_RELEASE_CHART_PATH: string;
    private readonly ctime;
    private readonly instance;
    private maxDownRate;
    private highWaterMark;
    private userAgent;
    private jar;
    constructor(options?: ClientOptions);
    cookies(): Cookies;
    setOptions(options?: ClientOptions): void;
    album(idOrURL: string | URL): Promise<Data.Album>;
    artist(idOrURL: string | URL): Promise<Data.Artist>;
    music(idOrURL: string | URL): Promise<Data.Stream>;
    musicSync(idOrURL: string | URL): Data.Stream;
    video(idOrURL: string | URL): Promise<Data.Stream>;
    videoSync(idOrURL: string | URL): Data.Stream;
}
export { Client };
