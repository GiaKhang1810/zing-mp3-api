import { PassThrough } from 'node:stream';
import { createSignature } from '../helper/encrypt.js';
import { Lapse } from '../helper/lapse.js';
import { ensureCookies } from '../util.js';
const music = async (options) => {
    try {
        void await ensureCookies(options.instance);
        const response = await options.instance.get(options.API_MUSIC_PATH, {
            params: {
                id: options.id,
                sig: createSignature(options.API_MUSIC_PATH, {
                    ctime: options.ctime,
                    id: options.id,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        let musicURL = response.data?.[320] && response.data[320] !== 'VIP' ? response.data[320] : response.data?.[128];
        if (response.err === -1150) {
            const retry = async (step, before) => {
                if (step > 3)
                    throw new Lapse('Music requested by VIP, PRI', 'ERROR_MUSIC_VIP_ONLY', void 0, before ? before.err : void 0);
                const retryData = await options.instance.get(options.EXTRA_API_MUSIC_PATH, {
                    params: {
                        id: options.id,
                        api_key: options.API_KEY_V3,
                        sig: createSignature('/song/get-song-info', {
                            ctime: options.ctime,
                            id: options.id,
                        }, options.SECRET_KEY_V3),
                        version: void 0,
                        apiKey: void 0
                    }
                });
                if (retryData.err === 0)
                    return retryData.data?.streaming?.default?.[128];
                return retry(step + 1, retryData);
            };
            musicURL = await retry(0);
        }
        if (!musicURL || !musicURL.trim().length)
            throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');
        const source = await options.instance.get(musicURL, { responseType: 'stream' });
        source.once('error', (error) => {
            const lapse = error instanceof Error
                ? error
                : new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
            source.destroy(lapse);
        });
        return source;
    }
    catch (error) {
        if (error instanceof Lapse)
            throw error;
        const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
        throw new Lapse(message, 'ERROR_MUSIC_FETCH', void 0, error);
    }
};
const musicSync = (options, highWaterMark) => {
    const copySource = new PassThrough({ highWaterMark });
    let copyCreatedSource;
    let closed = false;
    const destroySource = () => {
        if (!copyCreatedSource)
            return;
        copyCreatedSource.unpipe(copySource);
        if (!copyCreatedSource.destroyed)
            copyCreatedSource.destroy();
    };
    const closer = () => {
        closed = true;
        destroySource();
    };
    copySource.once('close', closer);
    copySource.once('error', closer);
    void music(options)
        .then((createdSource) => {
        copyCreatedSource = createdSource;
        createdSource.once('error', (error) => {
            const lapse = error instanceof Lapse
                ? error
                : new Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
            copySource.destroy(lapse);
        });
        if (closed || copySource.destroyed) {
            destroySource();
            return;
        }
        copyCreatedSource.pipe(copySource);
    })
        .catch((error) => {
        const lapse = error instanceof Lapse
            ? error
            : new Lapse(error instanceof Error ? error.message : 'An unknown error occurred while fetching', 'ERROR_MUSIC_FETCH', void 0, error);
        copySource.destroy(lapse);
    });
    return copySource;
};
export { music, musicSync };
