type RawThumbnail = {
    thumbnail: string;
    thumbnailM: string;
};
type RawMusicQuality = '128' | '320';
type RawVideoQuality = '360p' | '720p';
type RawMusicStreaming = Partial<Record<'128', string>>;
type RawVideoStreaming = Partial<Record<RawVideoQuality, string>>;
interface ResponseData<Data> {
    err: number;
    data: Data;
}
interface RawMusic extends Partial<Record<RawMusicQuality, string>> {
    streaming?: {
        default?: RawMusicStreaming;
    };
}
interface RawVideo {
    streaming?: {
        hls?: RawVideoStreaming;
    };
}
interface RawArtistBase extends RawThumbnail {
    id: string;
    alias: string;
    name: string;
}
interface RawSearchArtist extends RawArtistBase {
    totalFollow: number;
}
interface RawArtist extends RawArtistBase {
    birthday: string;
    biography: string;
    national: string;
    realname: string;
    totalFollow: number;
}
type RawArtistItem = RawArtistBase & {
    totalFollow?: number;
};
interface RawAlbum {
    encodeId: string;
    title: string;
    thumbnail: string;
    isoffical: boolean;
    releaseDate: string;
    releasedAt: number;
    artists: RawArtistItem[];
}
interface RawMedia extends RawThumbnail {
    encodeId: string;
    title: string;
    alias: string;
    username: string;
    artists: RawArtistItem[];
    duration: number;
    releaseDate: number;
    album?: RawAlbum;
    hasLyric?: boolean;
    isOffical: boolean;
    isPrivate: boolean;
    isWorldWide: boolean;
}
interface RawSearchMedia extends Omit<RawMedia, 'artists' | 'album'> {
    artists?: RawArtistItem[];
    album?: RawAlbum;
}
interface RawPlayListSong {
    items: RawMedia[];
    total: number;
    totalDuration: number;
}
interface RawPlayList extends RawThumbnail {
    encodeId: string;
    title: string;
    aliasTitle: string;
    artists: RawArtistItem[];
    contentLastUpdate: number;
    description: string;
    isoffical: boolean;
    isPrivate: boolean;
    isSingle: boolean;
    like: number;
    listen: number;
    releaseDate: string;
    releasedAt: number;
    song: RawPlayListSong;
}
type RawSearchPlayList = Omit<RawPlayList, 'song' | 'listen' | 'like' | 'description' | 'contentLastUpdate'>;
type RawMediaChart = RawMedia & {
    rakingStatus: number;
};
interface RawSearch<Data> {
    items: Data[];
}
interface RawSearchObj {
    video: RawSearchMedia;
    music: RawMedia;
    playlist: RawSearchPlayList;
    artist: RawSearchArtist;
}
export type { ResponseData, RawAlbum, RawArtist, RawArtistBase, RawArtistItem, RawMedia, RawSearch, RawMusic, RawMusicQuality, RawMusicStreaming, RawPlayList, RawPlayListSong, RawSearchMedia, RawThumbnail, RawVideo, RawVideoQuality, RawVideoStreaming, RawSearchPlayList, RawSearchArtist, RawMediaChart, RawSearchObj };
