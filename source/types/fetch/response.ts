export interface ResponseSearch {
    id: string;
    name: string;
    alias: string;
    isOffical: boolean;
    username: string;
    artists: {
        id: string;
        name: string;
        alias: string;
        thumbnail: {
            w240: string;
            w360: string;
        }
    }[];
    thumbnail: {
        w94: string;
        w240: string;
    }
    duration: number;
    releaseDate: number;
}