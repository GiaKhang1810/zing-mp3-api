import type { Readable } from "node:stream";
interface Response<Data> {
    err: number;
    data: Data;
}
declare namespace OriData {
    type MusicQuality = '128' | '320';
    type VideoQuality = '360p' | '720p';
    type MusicStreaming = Partial<Record<'128', string>>;
    type VideoStream = Partial<Record<VideoQuality, string>>;
    interface Thumbnail {
        thumbnail: string;
        thumbnailM: string;
    }
    export interface ListSong {
        items: Media[];
        total: number;
        totalDuration: number;
    }
    interface ArtistBase extends Thumbnail {
        id: string;
        alias: string;
        name: string;
    }
    export interface SearchArtist extends ArtistBase {
        totalFollow: number;
    }
    export interface Artist extends ArtistBase {
        birthday: string;
        biography: string;
        national: string;
        realname: string;
        totalFollow: number;
    }
    export type ArtistItem = ArtistBase & {
        totalFollow?: number;
    };
    export interface AlbumItem {
        encodeId: string;
        title: string;
        thumbnail: string;
        isoffical: boolean;
        releaseDate: string;
        releasedAt: number;
        artists: ArtistItem[];
    }
    export interface Media extends Thumbnail {
        encodeId: string;
        title: string;
        alias: string;
        username: string;
        artists: ArtistItem[];
        duration: number;
        releaseDate: number;
        album?: AlbumItem;
        hasLyric?: boolean;
        isOffical: boolean;
        isPrivate: boolean;
        isWorldWide: boolean;
    }
    export interface Music extends Partial<Record<MusicQuality, string>> {
        streaming?: {
            default?: MusicStreaming;
        };
    }
    export interface Video {
        streaming?: {
            hls?: VideoStream;
        };
    }
    export interface Album extends Thumbnail {
        encodeId: string;
        title: string;
        aliasTitle: string;
        artists: ArtistItem[];
        contentLastUpdate: number;
        description: string;
        isoffical: boolean;
        isPrivate: boolean;
        isSingle: boolean;
        like: number;
        listen: number;
        releaseDate: string;
        releasedAt: number;
        song: ListSong;
    }
    export {};
}
declare namespace Data {
    export type Stream = Readable;
    type CoverArtist = {
        w240: string;
        w600: string;
    };
    type CoverMedia = {
        w94: string;
        w240: string;
    };
    type CoverPlayList = {
        w165: string;
        w320: string;
    };
    interface Named {
        id: string;
        name: string;
    }
    export interface ArtistRef extends Named {
        alias: string;
        followCount?: number;
        thumbnail: CoverArtist;
    }
    export interface Artist extends ArtistRef {
        biography: string;
        birthday: string;
        followCount: number;
        national: string;
        realname: string;
        mediaCount: number;
        media: Media[];
    }
    export interface AlbumItem extends Named {
        artists: ArtistRef[];
        isOffical: boolean;
        releaseDate: string;
        releasedAt: number;
        thumbnail: Pick<CoverPlayList, 'w165'>;
    }
    export interface Album extends Named {
        alias: string;
        artists: ArtistRef[];
        description: string;
        duration: number;
        isOffical: boolean;
        isPrivate: boolean;
        isSingle: boolean;
        likeCount: number;
        listenCount: number;
        media: Media[];
        mediaCount: number;
        releaseDate: string;
        releasedAt: number;
        thumbnail: CoverPlayList;
        updatedAt: number;
    }
    export interface Media extends Named {
        album?: AlbumItem;
        alias: string;
        artists: ArtistRef[];
        duration: number;
        hasLyric: boolean;
        isOffical: boolean;
        isPrivate: boolean;
        isWorldWide: boolean;
        releaseDate: number;
        thumbnail: CoverMedia;
        username: string;
    }
    export {};
}
export type { Response, OriData, Data };
