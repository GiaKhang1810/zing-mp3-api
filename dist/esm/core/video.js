import m3u8stream from 'm3u8stream';
import { PassThrough } from 'node:stream';
import { createSignature } from '../helper/encrypt.js';
import { Lapse } from '../helper/lapse.js';
import { ensureCookies } from '../util.js';
const video = async (options, highWaterMark) => {
    try {
        void await ensureCookies(options.instance);
        const response = await options.instance.get(options.API_VIDEO_PATH, {
            params: {
                id: options.id,
                sig: createSignature(options.API_VIDEO_PATH, {
                    ctime: options.ctime,
                    id: options.id,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        if (response.err !== 0)
            throw new Lapse('Video could not be found', 'ERROR_VIDEO_NOT_FOUND', response.err);
        const sourceURL = response.data?.streaming?.hls?.['720p'] || response.data?.streaming?.hls?.['360p'];
        if (!sourceURL || !sourceURL.length)
            throw new Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');
        const source = m3u8stream(sourceURL, { highWaterMark });
        source.once('error', (error) => {
            const lapse = error instanceof Lapse
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
        throw new Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
    }
};
const videoSync = (options, highWaterMark) => {
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
    void video(options, highWaterMark)
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
        createdSource.pipe(copySource);
    })
        .catch((error) => {
        const lapse = error instanceof Lapse
            ? error
            : new Lapse(error instanceof Error ? error.message : 'An unknown error occurred while fetching', 'ERROR_VIDEO_FETCH', void 0, error);
        copySource.destroy(lapse);
    });
    return copySource;
};
export { video, videoSync };
