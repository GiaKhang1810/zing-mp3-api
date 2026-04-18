import type { AxiosInstance } from 'axios';
import type { Data } from './type.js';
interface Options {
    id: string;
    instance: AxiosInstance;
    API_ALBUM_PATH: string;
    VERSION_URL_V1: string;
    SECRET_KEY_V1: string;
    ctime: string;
}
export type { Options };
declare const album: (options: Options) => Promise<Data.Album>;
export { album };
