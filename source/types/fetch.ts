interface UriStreaming {
    err: number;
    msg: string;
    data: {
        128?: string;
        streaming?: {
            default?: {
                128?: string;
            }
        }
    }
}

interface UriVideo {
    err: number;
    msg: string;
    data: {
        streaming: {
            hls: {
                '360p': string;
            }
        }
    }
}

export type {
    UriStreaming,
    UriVideo
}