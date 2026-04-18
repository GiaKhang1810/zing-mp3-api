'use strict';

var axios = require('axios');
var album = require('./core/album.cjs');
var artist = require('./core/artist.cjs');
var music = require('./core/music.cjs');
var video = require('./core/video.cjs');
require('./helper/cookies.cjs');
var lapse = require('./helper/lapse.cjs');
var util = require('./util.cjs');

class Client {
    static BASE_URL = 'https://zingmp3.vn/';
    static VERSION_URL_V1 = '1.6.34';
    static VERSION_URL_V2 = '1.10.49';
    static VERSION_URL_V3 = '1.13.13';
    static SECRET_KEY_V1 = '2aa2d1c561e809b267f3638c4a307aab';
    static SECRET_KEY_V2 = 'acOrvUS15XRW2o9JksiK1KgQ6Vbds8ZW';
    static SECRET_KEY_V3 = '10a01dcf33762d3a204cb96429918ff6';
    static API_KEY_V1 = '88265e23d4284f25963e6eedac8fbfa3';
    static API_KEY_V2 = 'X5BM3w8N7MKozC0B85o4KMlzLZKhV00y';
    static API_KEY_V3 = '38e8643fb0dc04e8d65b99994d3dafff';
    static API_VIDEO_PATH = '/api/v2/page/get/video';
    static API_MUSIC_PATH = '/api/v2/song/get/streaming';
    static EXTRA_API_MUSIC_PATH = '/api/song/get-song-info';
    static API_SEARCH_PATH = '/api/v2/search';
    static API_ALBUM_PATH = '/api/v2/page/get/playlist';
    static API_MEDIA_DETAILS_PATH = '/api/v2/song/get/info';
    static API_ARTIST_PATH = '/api/v2/page/get/artist';
    static API_ARTIST_MEDIA_LIST_PATH = '/api/v2/song/get/list';
    static API_RELEASE_CHART_PATH = '/api/v2/page/get/newrelease-chart';
    ctime = Math.floor(Date.now() / 1000).toString();
    instance;
    maxDownRate;
    highWaterMark;
    userAgent;
    jar;
    constructor(options) {
        const mergedOptions = util.validateOptions(options);
        this.maxDownRate = mergedOptions.maxDownRate;
        this.highWaterMark = mergedOptions.highWaterMark;
        this.userAgent = mergedOptions.userAgent;
        this.jar = mergedOptions.jar;
        this.instance = axios.create({
            baseURL: Client.BASE_URL,
            maxRate: this.maxDownRate,
            params: {
                version: Client.VERSION_URL_V1,
                apiKey: Client.API_KEY_V1,
                ctime: this.ctime
            }
        });
        this.instance.interceptors.request.use(options => {
            const requestURL = util.appendURL(options.url, options.baseURL).toString();
            const cookie = this.jar.getCookieHeader(requestURL);
            options.headers.set('User-Agent', this.userAgent);
            options.headers.set('Cookie', cookie);
            return options;
        });
        this.instance.interceptors.response.use(response => {
            const setCookie = response.headers['set-cookie'];
            const requestURL = response.request?.res?.responseUrl ?? response.config.url;
            if (requestURL && Array.isArray(setCookie))
                this.jar.setCookies(setCookie, requestURL);
            return response.data;
        });
    }
    cookies() {
        return this.jar;
    }
    setOptions(options) {
        const mergedOptions = {
            maxDownRate: this.maxDownRate,
            highWaterMark: this.highWaterMark,
            userAgent: this.userAgent,
            jar: this.jar,
            ...options
        };
        const confirmedOptions = util.validateOptions(mergedOptions);
        this.maxDownRate = confirmedOptions.maxDownRate;
        this.highWaterMark = confirmedOptions.highWaterMark;
        this.userAgent = confirmedOptions.userAgent;
        this.jar = confirmedOptions.jar;
        this.instance.defaults.maxRate = confirmedOptions.maxDownRate;
    }
    album(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return album.album({
            id,
            instance: this.instance,
            API_ALBUM_PATH: Client.API_ALBUM_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            ctime: this.ctime
        });
    }
    artist(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return artist.artist({
            id,
            instance: this.instance,
            API_ARTIST_PATH: Client.API_ARTIST_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            API_ARTIST_MEDIA_LIST_PATH: Client.API_ARTIST_MEDIA_LIST_PATH,
            VERSION_URL_V2: Client.VERSION_URL_V2,
            API_KEY_V2: Client.API_KEY_V2,
            SECRET_KEY_V2: Client.SECRET_KEY_V2,
            ctime: this.ctime
        });
    }
    music(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return music.music({
            id,
            instance: this.instance,
            API_MUSIC_PATH: Client.API_MUSIC_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            EXTRA_API_MUSIC_PATH: Client.EXTRA_API_MUSIC_PATH,
            API_KEY_V3: Client.API_KEY_V3,
            SECRET_KEY_V3: Client.SECRET_KEY_V3,
            ctime: this.ctime
        });
    }
    musicSync(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return music.musicSync({
            id,
            instance: this.instance,
            API_MUSIC_PATH: Client.API_MUSIC_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            EXTRA_API_MUSIC_PATH: Client.EXTRA_API_MUSIC_PATH,
            API_KEY_V3: Client.API_KEY_V3,
            SECRET_KEY_V3: Client.SECRET_KEY_V3,
            ctime: this.ctime
        }, this.highWaterMark);
    }
    async video(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return video.video({
            id,
            instance: this.instance,
            API_VIDEO_PATH: Client.API_VIDEO_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            ctime: this.ctime
        }, this.highWaterMark);
    }
    videoSync(idOrURL) {
        const value = idOrURL instanceof URL ? idOrURL.toString() : idOrURL;
        if (typeof value !== 'string' || !value.trim().length)
            throw new lapse.Lapse('ID must be a non-empty string', 'ERROR_INVALID_ID');
        const id = util.isURL(value) ? util.getIDFromURL(value) : value;
        return video.videoSync({
            id,
            instance: this.instance,
            API_VIDEO_PATH: Client.API_VIDEO_PATH,
            VERSION_URL_V1: Client.VERSION_URL_V1,
            SECRET_KEY_V1: Client.SECRET_KEY_V1,
            ctime: this.ctime
        }, this.highWaterMark);
    }
}

exports.Client = Client;
