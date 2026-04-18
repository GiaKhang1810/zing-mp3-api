'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var cookies = require('./helper/cookies.cjs');
var encrypt = require('./helper/encrypt.cjs');
var lapse = require('./helper/lapse.cjs');
var client$1 = require('./client.cjs');
var util = require('./util.cjs');

const client = new client$1.Client();

exports.Cookies = cookies.Cookies;
exports.createSignature = encrypt.createSignature;
exports.Lapse = lapse.Lapse;
exports.Client = client$1.Client;
exports.getIDFromURL = util.getIDFromURL;
exports.default = client;
