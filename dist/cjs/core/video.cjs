'use strict';

var m3u8stream = require('m3u8stream');
var node_stream = require('node:stream');
var encrypt = require('../helper/encrypt.cjs');
var lapse = require('../helper/lapse.cjs');
var util = require('../util.cjs');

const video = async (options, highWaterMark) => {
    try {
        void await util.ensureCookies(options.instance);
        const response = await options.instance.get(options.API_VIDEO_PATH, {
            params: {
                id: options.id,
                sig: encrypt.createSignature(options.API_VIDEO_PATH, {
                    ctime: options.ctime,
                    id: options.id,
                    version: options.VERSION_URL_V1
                }, options.SECRET_KEY_V1)
            }
        });
        if (response.err !== 0)
            throw new lapse.Lapse('Video could not be found', 'ERROR_VIDEO_NOT_FOUND', response.err);
        const sourceURL = response.data?.streaming?.hls?.['720p'] || response.data?.streaming?.hls?.['360p'];
        if (!sourceURL || !sourceURL.length)
            throw new lapse.Lapse('Streaming URL not found', 'ERROR_STREAM_URL_NOT_FOUND');
        const source = m3u8stream(sourceURL, { highWaterMark });
        source.once('error', (error) => {
            const lapse$1 = error instanceof lapse.Lapse
                ? error
                : new lapse.Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
            source.destroy(lapse$1);
        });
        return source;
    }
    catch (error) {
        if (error instanceof lapse.Lapse)
            throw error;
        const message = error instanceof Error ? error.message : 'An unknown error occurred while fetching';
        throw new lapse.Lapse(message, 'ERROR_VIDEO_FETCH', void 0, error);
    }
};
const videoSync = (options, highWaterMark) => {
    const copySource = new node_stream.PassThrough({ highWaterMark });
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
            const lapse$1 = error instanceof lapse.Lapse
                ? error
                : new lapse.Lapse('Stream download failed', 'ERROR_STREAM_DOWNLOAD', void 0, error);
            copySource.destroy(lapse$1);
        });
        if (closed || copySource.destroyed) {
            destroySource();
            return;
        }
        createdSource.pipe(copySource);
    })
        .catch((error) => {
        const lapse$1 = error instanceof lapse.Lapse
            ? error
            : new lapse.Lapse(error instanceof Error ? error.message : 'An unknown error occurred while fetching', 'ERROR_VIDEO_FETCH', void 0, error);
        copySource.destroy(lapse$1);
    });
    return copySource;
};

exports.video = video;
exports.videoSync = videoSync;
