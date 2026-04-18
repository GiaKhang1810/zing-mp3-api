'use strict';

var encrypt = require('../helper/encrypt.cjs');
var lapse = require('../helper/lapse.cjs');
var util = require('../util.cjs');

const artist = async (options) => {
    try {
        void await util.ensureCookies(options.instance);
        const response = await options.instance.get(options.API_ARTIST_PATH, {
            params: {
                alias: options.id,
                sig: encrypt.createSignature(options.API_ARTIST_PATH, {
                    ctime: options.ctime,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        if (response.err === -108)
            throw new lapse.Lapse('Artist not found', 'ERROR_ARTIST_NOT_FOUND', response.err);
        if (response.err !== 0)
            throw new lapse.Lapse('Could not fetch artist', 'ERROR_ARTIST_FETCH', response.err);
        const mediaList = await options.instance.get(options.API_ARTIST_MEDIA_LIST_PATH, {
            params: {
                id: response.data.id,
                type: 'artist',
                page: 1,
                count: 0,
                sort: 'listen',
                sectionId: 'aSong',
                apiKey: options.API_KEY_V2,
                version: options.VERSION_URL_V2,
                sig: encrypt.createSignature(options.API_ARTIST_MEDIA_LIST_PATH, {
                    count: 0,
                    ctime: options.ctime,
                    id: response.data.id,
                    page: 1,
                    type: 'artist',
                    version: options.VERSION_URL_V2
                }, options.SECRET_KEY_V2)
            }
        });
        return {
            id: response.data.id,
            alias: response.data.alias,
            birthday: response.data.birthday,
            realname: response.data.realname,
            thumbnail: {
                w240: response.data.thumbnail,
                w600: response.data.thumbnailM
            },
            followCount: response.data.totalFollow,
            name: response.data.name,
            national: response.data.national,
            biography: response.data.biography,
            mediaCount: mediaList.data.total ?? 0,
            media: (mediaList.data.items ?? []).map(util.createMedia)
        };
    }
    catch (error) {
        if (error instanceof lapse.Lapse)
            throw error;
        const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
        throw new lapse.Lapse(message, 'ERROR_ARTIST_FETCH', void 0, error);
    }
};

exports.artist = artist;
