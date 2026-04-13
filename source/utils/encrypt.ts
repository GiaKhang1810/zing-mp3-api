import { createHash, createHmac } from 'node:crypto';

function createParams(params: Record<string, string | number>): string {
    return Object.keys(params).map(name => name + '=' + params[name]).join('');
}

function createHash256(value: string): string {
    return createHash('sha256')
        .update(value)
        .digest('hex');
}

function createHmac512(value: string, secret: string): string {
    return createHmac('sha512', secret)
        .update(
            Buffer.from(value, 'utf8')
        )
        .digest('hex');
}

export function createSignature(uri: string, params: Record<string, string | number>, secret: string): string {
    const paramString = createParams(params);
    const hash = createHash256(paramString);
    return createHmac512(uri + hash, secret);
}