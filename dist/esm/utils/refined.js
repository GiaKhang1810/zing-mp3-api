function createArtistRef(data) {
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
    };
}
function createSearchArtist(data) {
    return {
        id: data.id,
        alias: data.alias,
        name: data.name,
        thumbnail: {
            w240: data.thumbnail,
            w600: data.thumbnailM
        },
        followCount: data.totalFollow
    };
}
function createArtist(data, mediaList) {
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
    };
}
function createAlbum(data) {
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
    };
}
function createMedia(data) {
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
    };
}
function createMediaChart(data) {
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
    };
}
function createSearchMedia(data) {
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
    };
}
function createPlayList(data) {
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
    };
}
function createSearchPlayList(data) {
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
    };
}
export { createArtist, createMedia, createPlayList, createSearchMedia, createSearchPlayList, createSearchArtist, createMediaChart };
