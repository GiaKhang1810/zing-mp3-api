import type { AxiosInstance } from 'axios';
import type { Data } from './type.js';
interface Options {
    id: string;
    instance: AxiosInstance;
    API_ARTIST_PATH: string;
    VERSION_URL_V1: string;
    SECRET_KEY_V1: string;
    API_ARTIST_MEDIA_LIST_PATH: string;
    VERSION_URL_V2: string;
    API_KEY_V2: string;
    SECRET_KEY_V2: string;
    ctime: string;
}
export type { Options };
declare const artist: (options: Options) => Promise<Data.Artist>;
export { artist };
