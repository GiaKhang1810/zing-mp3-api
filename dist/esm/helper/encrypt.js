import { createHash, createHmac } from 'node:crypto';
function createParams(params) {
    return Object.keys(params).map(name => name + '=' + params[name]).join('');
}
function createHash256(value) {
    return createHash('sha256')
        .update(value)
        .digest('hex');
}
function createHmac512(value, secret) {
    return createHmac('sha512', secret)
        .update(Buffer.from(value, 'utf8'))
        .digest('hex');
}
export function createSignature(uri, params, secret) {
    const paramString = createParams(params);
    const hash = createHash256(paramString);
    return createHmac512(uri + hash, secret);
}
