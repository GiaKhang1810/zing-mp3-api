import type { AxiosInstance } from 'axios';
import type { Data } from './type.js';
interface Options {
    id: string;
    instance: AxiosInstance;
    API_VIDEO_PATH: string;
    VERSION_URL_V1: string;
    SECRET_KEY_V1: string;
    ctime: string;
}
export type { Options };
declare const video: (options: Options, highWaterMark: number) => Promise<Data.Stream>;
declare const videoSync: (options: Options, highWaterMark: number) => Data.Stream;
export { video, videoSync };
