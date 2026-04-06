import { equal } from 'node:assert';
import { Readable } from 'node:stream';

import client, { ZingClient } from '@khang07/zing-mp3-api';

describe('Client.esm', () => {
    it('should be an instance of ZingClient', () => {
        equal(client instanceof ZingClient, true);
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
