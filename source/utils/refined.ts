import type {
    RawArtist,
    RawArtistItem,
    RawAlbum,
    RawMedia,
    RawPlayList,
    RawPlayListSong,
    RawMediaChart,
    RawSearchObj
} from '../types/raw.js';

import type {
    Artist,
    ArtistRef,
    Album,
    Media,
    PlayList,
    SearchMedia,
    SearchPlayList,
    SearchArtist,
    MediaChart,
    SearchObj
} from '../types/response.js';

export type {
    Artist,
    Album,
    Media,
    PlayList,
    SearchMedia,
    SearchPlayList,
    SearchArtist
}

function createArtistRef(data: RawArtistItem): ArtistRef {
    return {
        id: data.id,
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

function createSearchArtist(data: RawSearchObj['artist']): SearchObj['artist'] {
    return {
        id: data.id,
        alias: data.alias,
        name: data.name,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        followCount: data.totalFollow
    }
}

function createArtist(data: RawArtist, mediaList: RawPlayListSong): Artist {
    return {
        id: data.id,
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
        biography: data.biography,
        mediaCount: mediaList.total ?? 0,
        media: (mediaList.items ?? []).map(createMedia)
    }
}

function createAlbum(data: RawAlbum): Album {
    return {
        id: data.encodeId,
        name: data.title,
        isOffical: data.isoffical,
        releaseDate: data.releaseDate,
        releasedAt: data.releasedAt,
        artists: (data.artists ?? []).map(createArtistRef),
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
        artists: (data.artists ?? []).map(createArtistRef),
        isWorldWide: data.isWorldWide,
        thumbnail: {
            w94: data.thumbnail,
            w240: data.thumbnailM
        },
        duration: data.duration,
        isPrivate: data.isPrivate,
        releaseDate: data.releaseDate,
        album: data.album ? createAlbum(data.album) : void 0,
        hasLyric: !!data.hasLyric
    }
}

function createMediaChart(data: RawMediaChart): MediaChart {
    return {
        id: data.encodeId,
        name: data.title,
        alias: data.alias,
        isOffical: data.isOffical,
        username: data.username,
        artists: (data.artists ?? []).map(createArtistRef),
        isWorldWide: data.isWorldWide,
        thumbnail: {
            w94: data.thumbnail,
            w240: data.thumbnailM
        },
        duration: data.duration,
        rakingStatus: data.rakingStatus,
        isPrivate: data.isPrivate,
        releaseDate: data.releaseDate,
        album: data.album ? createAlbum(data.album) : void 0,
        hasLyric: !!data.hasLyric
    }
}

function createSearchMedia(data: RawSearchObj['music'] | RawSearchObj['video']): SearchObj['music'] | SearchObj['video'] {
    return {
        id: data.encodeId,
        name: data.title,
        alias: data.alias,
        isOffical: data.isOffical,
        username: data.username,
        artists: (data.artists ?? []).map(createArtistRef),
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
        artists: (data.artists ?? []).map(createArtistRef),
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

function createSearchPlayList(data: RawSearchObj['playlist']): SearchObj['playlist'] {
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
        artists: (data.artists ?? []).map(createArtistRef),
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
    createSearchArtist,
    createMediaChart
}