interface UriStreaming {
    err: number;
    msg: string;
    data: Partial<Record<128, string>>;
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