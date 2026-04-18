import { createSignature } from '../helper/encrypt.js';
import { Lapse } from '../helper/lapse.js';
import { createArtistRef, createMedia, ensureCookies } from '../util.js';
const album = async (options) => {
    try {
        void await ensureCookies(options.instance);
        const response = await options.instance.get(options.API_ALBUM_PATH, {
            params: {
                id: options.id,
                sig: createSignature(options.API_ALBUM_PATH, {
                    ctime: options.ctime,
                    id: options.id,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        if (response.err !== 0)
            throw new Lapse('Could not find playlist', 'ERROR_PLAYLIST_NOT_FOUND', response.err, response);
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
            artists: (response.data.artists ?? []).map(createArtistRef),
            isPrivate: response.data.isPrivate,
            isSingle: response.data.isSingle,
            description: response.data.description,
            alias: response.data.aliasTitle,
            updatedAt: response.data.contentLastUpdate,
            likeCount: response.data.like,
            listenCount: response.data.listen,
            mediaCount: response.data.song.total,
            duration: response.data.song.totalDuration,
            media: response.data.song.items.map(createMedia)
        };
    }
    catch (error) {
        if (error instanceof Lapse)
            throw error;
        const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
        throw new Lapse(message, 'ERROR_ALBUM_FETCH', void 0, error);
    }
};
export { album };
