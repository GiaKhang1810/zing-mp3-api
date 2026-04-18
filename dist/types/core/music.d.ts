import type { AxiosInstance } from 'axios';
import type { Data } from './type.js';
interface Options {
    id: string;
    instance: AxiosInstance;
    API_MUSIC_PATH: string;
    VERSION_URL_V1: string;
    SECRET_KEY_V1: string;
    EXTRA_API_MUSIC_PATH: string;
    API_KEY_V3: string;
    SECRET_KEY_V3: string;
    ctime: string;
}
export type { Options };
declare const music: (options: Options) => Promise<Data.Stream>;
declare const musicSync: (options: Options, highWaterMark: number) => Data.Stream;
export { music, musicSync };
