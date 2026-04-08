import type {
    RawArtist,
    RawArtistItem,
    RawAlbum,
    RawMedia,
    RawPlayList,
    RawSearchMedia,
    RawSearchPlayList,
    RawSearchArtist
} from '../types/raw.js';

import type {
    Artist,
    ArtistRef,
    Album,
    Media,
    PlayList,
    SearchMedia,
    SearchPlayList,
    SearchArtist
} from '../types/response.js';

function createArtistRef(data: RawArtistItem): ArtistRef {
    return {
        alias: data.alias,
        name: data.name,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        ...(typeof data.totalFollow === 'number' ? {
            followCount: data.totalFollow
        } : {})
    }
}

function createSearchArtist(data: RawSearchArtist): SearchArtist {
    return {
        alias: data.alias,
        name: data.name,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        followCount: data.totalFollow
    }
}

function createArtist(data: RawArtist): Artist {
    return {
        alias: data.alias,
        birthday: data.birthday,
        realname: data.realname,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        followCount: data.totalFollow,
        name: data.name,
        national: data.national,
        biography: data.biography
    }
}

function createAlbum(data: RawAlbum): Album {
    return {
        id: data.encodeId,
        name: data.title,
        isOffical: data.isoffical,
        releaseDate: data.releaseDate,
        releasedAt: data.releasedAt,
        artists: data.artists.map(createArtistRef),
        thumbnail: {
            w165: data.thumbnail
        }
    }
}

function createMedia(data: RawMedia): Media {
    return {
        id: data.encodeId,
        name: data.title,
        alias: data.alias,
        isOffical: data.isOffical,
        username: data.username,
        artists: data.artists.map(createArtistRef),
        isWorldWide: data.isWorldWide,
        thumbnail: {
            w94: data.thumbnail,
            w240: data.thumbnailM
        },
        duration: data.duration,
        isPrivate: data.isPrivate,
        releaseDate: data.releaseDate,
        album: createAlbum(data.album),
        hasLyric: !!data.hasLyric
    }
}

function createSearchMedia(data: RawSearchMedia): SearchMedia {
    return {
        id: data.encodeId,
        name: data.title,
        alias: data.alias,
        isOffical: data.isOffical,
        username: data.username,
        artists: data.artists ? data.artists.map(createArtistRef) : [],
        isWorldWide: data.isWorldWide,
        thumbnail: {
            w94: data.thumbnail,
            w240: data.thumbnailM
        },
        album: data.album ? {
            id: data.album.encodeId,
            name: data.album.title,
            isOffical: data.album.isoffical,
            releaseDate: data.album.releaseDate,
            releasedAt: data.album.releasedAt,
            thumbnail: {
                w165: data.album.thumbnail
            }
        } : void 0,
        duration: data.duration,
        hasLyric: !!data.hasLyric
    }
}

function createPlayList(data: RawPlayList): PlayList {
    return {
        id: data.encodeId,
        name: data.title,
        thumbnail: {
            w165: data.thumbnail,
            w320: data.thumbnailM
        },
        isOffical: data.isoffical,
        releaseDate: data.releaseDate,
        releasedAt: data.releasedAt,
        artists: data.artists.map(createArtistRef),
        isPrivate: data.isPrivate,
        isSingle: data.isSingle,
        description: data.description,
        alias: data.aliasTitle,
        updatedAt: data.contentLastUpdate,
        likeCount: data.like,
        listenCount: data.listen,
        mediaCount: data.song.total,
        duration: data.song.totalDuration,
        media: data.song.items.map(createMedia)
    }
}

function createSearchPlayList(data: RawSearchPlayList): SearchPlayList {
    return {
        id: data.encodeId,
        name: data.title,
        thumbnail: {
            w165: data.thumbnail,
            w320: data.thumbnailM
        },
        isOffical: data.isoffical,
        releaseDate: data.releaseDate,
        releasedAt: data.releasedAt,
        artists: data.artists.map(createArtistRef),
        isPrivate: data.isPrivate,
        isSingle: data.isSingle,
        alias: data.aliasTitle
    }
}

export {
    createArtist,
    createMedia,
    createPlayList,
    createSearchMedia,
    createSearchPlayList,
    createSearchArtist
}