import { equal } from 'node:assert';
import { Readable } from 'node:stream';

import { Client } from '@khang07/zing-mp3-api';

const client = new Client({
    maxLoad: 100 * 1024 * 1024,
    maxHighWaterMark: 100 * 1024 * 1024,
});

describe('Client.esm', () => {
    it('should be an instance of Client', () => {
        equal(client instanceof Client, true);
    });

    it('should search for music and return an array', async () => {
        const response = await client.search('Do For Love - Bray');

        equal(Array.isArray(response), true);
    });

    it('should return a readable stream for a music', async () => {
        const response = await client.search('Do For Love - Bray');
        const source = await client.music(response[0].id);

        equal(source instanceof Readable, true);
    });

    it('should return a readable stream for a music using the sync method', async () => {
        const response = await client.search('Do For Love - Bray');
        const source = client.musicSyncLike(response[0].id);

        equal(source instanceof Readable, true);
    });

    it('should return a readable stream for a video', async () => {
        const response = await client.search('Do For Love - Bray');
        const source = await client.video(response[0].id);

        equal(source instanceof Readable, true);
    });

    it('should return a readable stream for a video using the sync method', async () => {
        const response = await client.search('Do For Love - Bray');
        const source = client.videoSyncLike(response[0].id);

        equal(source instanceof Readable, true);
    });
});
