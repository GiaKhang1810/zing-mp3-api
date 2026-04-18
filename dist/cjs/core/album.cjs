'use strict';

var encrypt = require('../helper/encrypt.cjs');
var lapse = require('../helper/lapse.cjs');
var util = require('../util.cjs');

const album = async (options) => {
    try {
        void await util.ensureCookies(options.instance);
        const response = await options.instance.get(options.API_ALBUM_PATH, {
            params: {
                id: options.id,
                sig: encrypt.createSignature(options.API_ALBUM_PATH, {
                    ctime: options.ctime,
                    id: options.id,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        if (response.err !== 0)
            throw new lapse.Lapse('Could not find playlist', 'ERROR_PLAYLIST_NOT_FOUND', response.err, response);
        return {
            id: response.data.encodeId,
            name: response.data.title,
            thumbnail: {
                w165: response.data.thumbnail,
                w320: response.data.thumbnailM
            },
            isOffical: response.data.isoffical,
            releaseDate: response.data.releaseDate,
            releasedAt: response.data.releasedAt,
            artists: (response.data.artists ?? []).map(util.createArtistRef),
            isPrivate: response.data.isPrivate,
            isSingle: response.data.isSingle,
            description: response.data.description,
            alias: response.data.aliasTitle,
            updatedAt: response.data.contentLastUpdate,
            likeCount: response.data.like,
            listenCount: response.data.listen,
            mediaCount: response.data.song.total,
            duration: response.data.song.totalDuration,
            media: response.data.song.items.map(util.createMedia)
        };
    }
    catch (error) {
        if (error instanceof lapse.Lapse)
            throw error;
        const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
        throw new lapse.Lapse(message, 'ERROR_ALBUM_FETCH', void 0, error);
    }
};

exports.album = album;
