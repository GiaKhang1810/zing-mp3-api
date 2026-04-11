const assert = require('node:assert/strict');
const { PassThrough } = require('node:stream');

const client = require('@khang07/zing-mp3-api');
const { Client, Lapse, Cookies, createSignature } = client;

const describeIfLive = process.env.ZING_MP3_LIVE === '1' ? describe : describe.skip;

function isLapseWithCode(error, code) {
    assert.ok(error instanceof Lapse);
    assert.equal(error.name, 'ZING_MP3_ERROR');
    assert.equal(error.code, code);
    return true;
}

function waitForStreamError(stream, message) {
    return new Promise((resolve, reject) => {
        stream.once('error', resolve);
        stream.once('data', () => reject(new Error(message)));
    });
}

describe('ESM entry', function () {
    it('exports default client and Client class', function () {
        assert.ok(client instanceof Client);
        assert.equal(typeof Client, 'function');
    });

    it('exports public utilities', function () {
        assert.ok(new Cookies() instanceof Cookies);
        assert.equal(typeof createSignature, 'function');
        assert.ok(new Lapse('x', 'CODE') instanceof Error);
    });
});

describe('Client.getIDFromURL()', function () {
    it('extracts id from a ZingMp3 html URL', function () {
        assert.equal(
            Client.getIDFromURL('https://zingmp3.vn/bai-hat/test/ZWZB9WAB.html'),
            'ZWZB9WAB'
        );
    });

    it('extracts first path segment from a root-style ZingMp3 URL', function () {
        assert.equal(
            Client.getIDFromURL('https://zingmp3.vn/mono'),
            'mono'
        );
    });

    it('throws ERROR_INVALID_URL for empty input', function () {
        assert.throws(
            () => Client.getIDFromURL(''),
            (error) => isLapseWithCode(error, 'ERROR_INVALID_URL')
        );
    });

    it('throws ERROR_INVALID_URL for unsupported URL', function () {
        assert.throws(
            () => Client.getIDFromURL('https://example.com/test'),
            (error) => isLapseWithCode(error, 'ERROR_INVALID_URL')
        );
    });
});

describe('Client input guards', function () {
    it('music() rejects empty ids', async function () {
        await assert.rejects(client.music(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_ID'));
    });

    it('video() rejects empty ids', async function () {
        await assert.rejects(client.video(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_ID'));
    });

    it('playlist() rejects empty ids', async function () {
        await assert.rejects(client.playlist(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_ID'));
    });

    it('artist() rejects empty ids', async function () {
        await assert.rejects(client.artist(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_ID'));
    });

    it('mediaDetails() rejects empty ids', async function () {
        await assert.rejects(client.mediaDetails(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_ID'));
    });

    it('searchMusic() rejects empty queries', async function () {
        await assert.rejects(client.searchMusic(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_QUERY'));
    });

    it('searchVideo() rejects empty queries', async function () {
        await assert.rejects(client.searchVideo(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_QUERY'));
    });

    it('searchList() rejects empty queries', async function () {
        await assert.rejects(client.searchList(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_QUERY'));
    });

    it('searchArtist() rejects empty queries', async function () {
        await assert.rejects(client.searchArtist(''), (error) => isLapseWithCode(error, 'ERROR_INVALID_QUERY'));
    });
});

describe('videoSync()', function () {
    it('forwards Lapse rejection as stream error and destroys output', async function () {
        const instance = new Client();
        const lapse = new Lapse('Failed to fetch video stream', 'ERROR_VIDEO_FETCH', 500);

        instance.video = async function () {
            throw lapse;
        };

        const stream = instance.videoSync('ZWZB9WAB');
        const error = await waitForStreamError(stream, 'videoSync() should not emit data');

        assert.equal(error, lapse);
        assert.equal(stream.destroyed, true);
    });

    it('wraps non-Lapse rejection into ERROR_VIDEO_FETCH', async function () {
        const instance = new Client();

        instance.video = async function () {
            throw new Error('boom');
        };

        const stream = instance.videoSync('ZWZB9WAB');
        const error = await waitForStreamError(stream, 'videoSync() should not emit data');

        assert.ok(error instanceof Lapse);
        assert.equal(error.code, 'ERROR_VIDEO_FETCH');
        assert.equal(error.message, 'Failed to fetch video stream');
        assert.equal(stream.destroyed, true);
    });

    it('forwards source stream errors as ERROR_STREAM_DOWNLOAD when needed', async function () {
        const instance = new Client();
        const source = new PassThrough();

        instance.video = async function () {
            return source;
        };

        const stream = instance.videoSync('ZWZB9WAB');

        queueMicrotask(() => {
            source.destroy(new Error('download failed'));
        });

        const error = await waitForStreamError(stream, 'videoSync() should not emit data');

        assert.ok(error instanceof Lapse);
        assert.equal(error.code, 'ERROR_STREAM_DOWNLOAD');
        assert.equal(error.message, 'Stream download failed');
        assert.equal(stream.destroyed, true);
    });

    it('destroys source when output stream is closed', async function () {
        const instance = new Client();
        const source = new PassThrough();

        instance.video = async function () {
            return source;
        };

        const stream = instance.videoSync('ZWZB9WAB');

        stream.resume();
        stream.destroy();

        await new Promise((resolve) => setImmediate(resolve));

        assert.equal(source.destroyed, true);
    });
});

describe('musicSync()', function () {
    it('forwards Lapse rejection as stream error and destroys output', async function () {
        const instance = new Client();
        const lapse = new Lapse('Failed to fetch music stream', 'ERROR_MUSIC_FETCH', 500);

        instance.music = async function () {
            throw lapse;
        };

        const stream = instance.musicSync('ZWZB9WAB');
        const error = await waitForStreamError(stream, 'musicSync() should not emit data');

        assert.equal(error, lapse);
        assert.equal(stream.destroyed, true);
    });

    it('wraps non-Lapse rejection into ERROR_MUSIC_FETCH', async function () {
        const instance = new Client();

        instance.music = async function () {
            throw new Error('boom');
        };

        const stream = instance.musicSync('ZWZB9WAB');
        const error = await waitForStreamError(stream, 'musicSync() should not emit data');

        assert.ok(error instanceof Lapse);
        assert.equal(error.code, 'ERROR_MUSIC_FETCH');
        assert.equal(error.message, 'Failed to fetch music stream');
        assert.equal(stream.destroyed, true);
    });

    it('forwards source stream errors as ERROR_STREAM_DOWNLOAD when needed', async function () {
        const instance = new Client();
        const source = new PassThrough();

        instance.music = async function () {
            return source;
        };

        const stream = instance.musicSync('ZWZB9WAB');

        queueMicrotask(() => {
            source.destroy(new Error('download failed'));
        });

        const error = await waitForStreamError(stream, 'musicSync() should not emit data');

        assert.ok(error instanceof Lapse);
        assert.equal(error.code, 'ERROR_STREAM_DOWNLOAD');
        assert.equal(error.message, 'Stream download failed');
        assert.equal(stream.destroyed, true);
    });

    it('destroys source when output stream is closed', async function () {
        const instance = new Client();
        const source = new PassThrough();

        instance.music = async function () {
            return source;
        };

        const stream = instance.musicSync('ZWZB9WAB');

        stream.resume();
        stream.destroy();

        await new Promise((resolve) => setImmediate(resolve));

        assert.equal(source.destroyed, true);
    });
});

describe('Cookies', function () {
    it('stores and sends cookies for matching requests', function () {
        const jar = new Cookies();

        jar.setCookie('sid=abc; Path=/; HttpOnly', 'https://zingmp3.vn/');

        assert.equal(jar.getCookieHeader('https://zingmp3.vn/'), 'sid=abc');
        assert.deepEqual(
            jar.applyToHeaders('https://zingmp3.vn/', { Accept: 'application/json' }),
            {
                Accept: 'application/json',
                Cookie: 'sid=abc'
            }
        );
    });

    it('does not send secure cookies over http', function () {
        const jar = new Cookies();

        jar.setCookie('sid=abc; Path=/; Secure', 'https://zingmp3.vn/');

        assert.equal(jar.getCookieHeader('http://zingmp3.vn/'), '');
        assert.equal(jar.getCookieHeader('https://zingmp3.vn/'), 'sid=abc');
    });

    it('supports deleteCookie(), toJSON(), fromJSON(), cleanup()', function () {
        const jar = new Cookies();

        jar.setCookie('sid=abc; Path=/', 'https://zingmp3.vn/');
        jar.setCookie('theme=dark; Path=/', 'https://zingmp3.vn/');

        const snapshot = jar.toJSON();
        assert.equal(snapshot.length, 2);

        jar.deleteCookie('zingmp3.vn', '/', 'sid');
        assert.equal(jar.getCookieHeader('https://zingmp3.vn/'), 'theme=dark');

        const restored = new Cookies();
        restored.fromJSON(snapshot);
        restored.cleanup();

        assert.equal(restored.getCookieHeader('https://zingmp3.vn/'), 'sid=abc; theme=dark');
    });

    it('removes expired cookies', function () {
        const jar = new Cookies();

        jar.setCookie('expired=1; Max-Age=0; Path=/', 'https://zingmp3.vn/');

        assert.equal(jar.getCookieHeader('https://zingmp3.vn/'), '');
        assert.deepEqual(jar.toJSON(), []);
    });
});

describe('createSignature()', function () {
    it('returns a deterministic sha512 hex signature', function () {
        const signature = createSignature('/api/test', 'a=1b=2', 'secret');

        assert.equal(signature.length, 128);
        assert.match(signature, /^[a-f0-9]{128}$/);
        assert.equal(signature, createSignature('/api/test', 'a=1b=2', 'secret'));
        assert.notEqual(signature, createSignature('/api/test', 'a=1b=3', 'secret'));
    });
});

describe('Lapse', function () {
    it('stores code, status and cause', function () {
        const cause = new Error('boom');
        const error = new Lapse('message', 'ERROR_SAMPLE', 400, cause);

        assert.equal(error.name, 'ZING_MP3_ERROR');
        assert.equal(error.message, 'message');
        assert.equal(error.code, 'ERROR_SAMPLE');
        assert.equal(error.status, 400);
        assert.equal(error.cause, cause);
    });
});

describeIfLive('Live integration', function () {
    this.timeout(30000);

    it('searchMusic() returns Media items', async function () {
        const items = await client.searchMusic('sign');

        assert.ok(Array.isArray(items));
        assert.ok(items.length > 0);
        assert.equal(typeof items[0].id, 'string');
        assert.equal(typeof items[0].name, 'string');
    });

    it('searchVideo() returns SearhMedia items', async function () {
        const items = await client.searchVideo('sign');

        assert.ok(Array.isArray(items));
        assert.ok(items.length > 0);
        assert.equal(typeof items[0].id, 'string');
        assert.equal(typeof items[0].album === 'undefined' || typeof items[0].album === 'object', true);
    });

    it('searchList() returns SearchPlayList items', async function () {
        const items = await client.searchList('sign');

        assert.ok(Array.isArray(items));
        assert.ok(items.length > 0);
        assert.equal(typeof items[0].id, 'string');
        assert.equal(Object.hasOwn(items[0], 'media'), false);
    });

    it('searchArtist() returns artist items', async function () {
        const items = await client.searchArtist('Bray');

        assert.ok(Array.isArray(items));
        assert.ok(items.length > 0);
        assert.equal(typeof items[0].alias, 'string');
        assert.equal(typeof items[0].followCount, 'number');
    });
});