type CoverArtist = {
    w240: string;
    w600: string;
}

type CoverMedia = {
    w94: string;
    w240: string;
}

type CoverPlayList = {
    w165: string;
    w320: string;
}

interface Named {
    id: string;
    name: string;
}

interface ArtistRef extends Named {
    alias: string;
    followCount?: number;
    thumbnail: CoverArtist;
}


interface Artist extends ArtistRef {
    biography: string;
    birthday: string;
    followCount: number;
    national: string;
    realname: string;
    mediaCount: number;
    media: Media[];
}

interface Album extends Named {
    artists: ArtistRef[];
    isOffical: boolean;
    releaseDate: string;
    releasedAt: number;
    thumbnail: Pick<CoverPlayList, 'w165'>;
}

interface Media extends Named {
    album?: Album;
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

interface PlayList extends Named {
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

type SearchArtist = Required<ArtistRef>;
type SearchMediaAlbum = Omit<Album, 'artists'>;
type SearchPlayList = Omit<PlayList, 'updatedAt' | 'mediaCount' | 'listenCount' | 'likeCount' | 'duration' | 'description' | 'media'>;
type SearchMedia = Omit<Media, 'isPrivate' | 'releaseDate' | 'album'> & {
    album?: SearchMediaAlbum;
}

type MediaChart = Media & {
    rakingStatus: number;
}

interface SearchObj {
    video: SearchMedia;
    music: SearchMedia;
    playlist: SearchPlayList;
    artist: SearchArtist;
}

type ParamSearch = Record<string, string | number | void>;

export type {
    Album,
    Artist,
    ArtistRef,
    CoverArtist,
    CoverMedia,
    CoverPlayList,
    Media,
    SearchMedia,
    PlayList,
    SearchPlayList,
    SearchArtist,
    SearchMediaAlbum,
    MediaChart,
    SearchObj,
    ParamSearch
}