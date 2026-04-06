import { createHash, createHmac } from 'node:crypto';

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

export function createSignature(uri: string, params: string, secret: string): string {
    const hash = createHash256(params);
    return createHmac512(uri + hash, secret);
}