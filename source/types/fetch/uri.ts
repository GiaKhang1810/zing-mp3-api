export namespace Uri {
    export interface Music {
        err: number;
        data: {
            128?: string;
            streaming?: {
                default?: {
                    128?: string;
                }
            }
        }
    } 

    export interface Video {
        err: number;
        data: {
            streaming?: {
                hls?: {
                    '360p'?: string;
                }
            }
        }
    } 

    export interface Search {
        err: number;
        data: {
            songs?: {
                encodeId: string;
                title: string;
                alias: string;
                isOffical: boolean;
                username: string;
                artists: {
                    id: string;
                    name: string;
                    alias: string;
                    thumbnail: string;
                    thumbnailM: string;
                }[];
                thumbnailM: string;
                thumbnail: string;
                duration: number;
                releaseDate: number;
            }[];
        }
    }
}