# @khang07/zing-mp3-api

A lightweight Node.js library for working with Zing MP3 streams.

This package focuses on a small, practical API:
- fetch a music stream by song ID
- fetch a video stream by video ID
- search songs by keyword
- expose a reusable cookie jar utility
- expose the signature generator used by the API
- wrap library failures with a dedicated `Lapse` error class

The package ships with:
- ESM build
- CommonJS build
- TypeScript declarations

## Features

- Stream music as a Node.js `Readable`
- Stream video as a Node.js `Readable`
- Sync-like helpers that return a stream immediately and pipe later
- Built-in cookie handling for Zing requests
- Typed response for `search()`
- Small public surface area

## Installation

```bash
npm install @khang07/zing-mp3-api
```

## Requirements

- Node.js
- A runtime that supports Node streams

## Package exports

Main package:

```ts
import client, { ZingClient } from "@khang07/zing-mp3-api";
```

Subpath exports:

```ts
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";
import { createSignature } from "@khang07/zing-mp3-api/utils/encrypt";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";
```

## Quick start

### Use the default client

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

const stream = await client.music("Z7ACBFEF");
stream.pipe(fs.createWriteStream("music.mp3"));
```

### Create your own client

```ts
import { ZingClient } from "@khang07/zing-mp3-api";

const client = new ZingClient({
    maxRate: [100 * 1024, 16 * 1024]
});
```

## API

### `new ZingClient(options?)`

Create a new client instance.

#### Parameters

```ts
interface ClientOptions {
    maxRate?: [download?: number, highWaterMark?: number];
}
```

#### Notes

- `maxRate[0]`: download rate limit passed to Axios
- `maxRate[1]`: `highWaterMark` used by `musicSyncLike()` and `videoSyncLike()`

### `client.music(musicID)`

Fetches a music stream by song ID.

#### Signature

```ts
music(musicID: string): Promise<Readable>
```

#### Returns

A `Promise<Readable>` for the audio stream.

#### Example

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

const music = await client.music("Z7ACBFEF");
music.pipe(fs.createWriteStream("track.mp3"));
```

#### Behavior

- validates the input ID
- initializes cookies if needed
- requests the Zing streaming endpoint
- retries a secondary endpoint for some VIP/PRI-style responses
- throws a `Lapse` when the song cannot be streamed

### `client.musicSyncLike(musicID)`

Returns a stream immediately and starts resolving the remote source in the background.

#### Signature

```ts
musicSyncLike(musicID: string): Readable
```

#### Example

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

const music = client.musicSyncLike("Z7ACBFEF");
music.pipe(fs.createWriteStream("track.mp3"));
```

#### When to use

Use this when you want a stream object right away instead of awaiting `Promise<Readable>`.

### `client.video(videoID)`

Fetches a video stream by video ID.

#### Signature

```ts
video(videoID: string): Promise<Readable>
```

#### Returns

A `Promise<Readable>` for the video stream.

#### Example

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

const video = await client.video("ZO8I9ZZC");
video.pipe(fs.createWriteStream("video.ts"));
```

#### Behavior

- validates the input ID
- initializes cookies if needed
- requests the video endpoint
- reads the HLS `360p` stream URL from the response
- uses `m3u8stream` to produce the returned stream

#### Important

The current implementation streams HLS media from the `360p` source. It does **not** remux or convert the output into MP4 by itself.

### `client.videoSyncLike(videoID)`

Returns a stream immediately and starts resolving the remote video source in the background.

#### Signature

```ts
videoSyncLike(videoID: string): Readable
```

#### Example

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

const video = client.videoSyncLike("ZO8I9ZZC");
video.pipe(fs.createWriteStream("video.ts"));
```

### `client.search(keyword)`

Searches songs by keyword.

#### Signature

```ts
search(keyword: string): Promise<ResponseSearch[]>
```

#### Return type

```ts
interface ResponseSearch {
    id: string;
    name: string;
    alias: string;
    isOffical: boolean;
    username: string;
    artists: {
        id: string;
        name: string;
        alias: string;
        thumbnail: {
            w240: string;
            w360: string;
        };
    }[];
    thumbnail: {
        w94: string;
        w240: string;
    };
    duration: number;
    releaseDate: number;
}
```

#### Example

```ts
import client from "@khang07/zing-mp3-api";

const results = await client.search("mở mắt");

for (const song of results) {
    console.log(song.id, song.name, song.artists.map((artist) => artist.name).join(", "));
}
```

#### Important

The current implementation only maps the `songs` section from the search response. It does not currently return artists, playlists, or videos.

## Utility exports

### `Cookies`

A lightweight in-memory cookie jar.

#### Available methods

```ts
class Cookies {
    setCookie(setCookie: string, requestUrl: string): void;
    setCookies(setCookies: string[] | undefined, requestUrl: string): void;
    getCookies(requestUrl: string): CookieRecord[];
    getCookieHeader(requestUrl: string): string;
    applyToHeaders(requestUrl: string, headers?: Record<string, string>): Record<string, string>;
    deleteCookie(domain: string, path: string, name: string): void;
    cleanup(): void;
    toJSON(): CookieRecord[];
    fromJSON(cookies: CookieRecord[]): void;
}
```

#### Example

```ts
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";

const jar = new Cookies();
jar.setCookie("sessionid=abc123; Path=/; HttpOnly", "https://zingmp3.vn/");

const headers = jar.applyToHeaders("https://zingmp3.vn/api/v2/song/get/streaming");
console.log(headers.Cookie);
```

### `createSignature(uri, params, secret)`

Creates the request signature used by the Zing endpoints.

#### Signature

```ts
createSignature(uri: string, params: string, secret: string): string
```

#### Example

```ts
import { createSignature } from "@khang07/zing-mp3-api/utils/encrypt";

const sig = createSignature(
    "/api/v2/song/get/streaming",
    "ctime=1234567890id=Z7ACBFEFversion=1.6.34",
    "2aa2d1c561e809b267f3638c4a307aab"
);

console.log(sig);
```

### `Lapse`

A custom error class used by the library.

#### Signature

```ts
class Lapse extends Error {
    code: string;
    status?: number;
    cause?: unknown;
}
```

#### Example

```ts
import client from "@khang07/zing-mp3-api";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";

try {
    await client.music("");
} catch (error) {
    if (error instanceof Lapse) {
        console.error(error.name);
        console.error(error.code);
        console.error(error.message);
        console.error(error.status);
    }
}
```

## Error codes

The current codebase throws these `Lapse.code` values:

| Code | Meaning |
|---|---|
| `ERROR_INVALID_ID` | `music()` or `video()` received an empty or invalid ID |
| `ERROR_INVALID_KEYWORD` | `search()` received an empty keyword |
| `ERROR_MUSIC_NOT_FOUND` | Music was not found from the primary endpoint |
| `ERROR_MUSIC_VIP_ONLY` | Music required access not available through the fallback flow |
| `ERROR_VIDEO_NOT_FOUND` | Video was not found |
| `ERROR_STREAM_URL_NOT_FOUND` | The API response did not contain a playable stream URL |
| `ERROR_STREAM_DOWNLOAD` | The download stream failed while reading data |
| `ERROR_MUSIC_FETCH` | A non-library failure occurred while fetching music |
| `ERROR_VIDEO_FETCH` | A non-library failure occurred while fetching video |
| `ERROR_SEARCH_FAILED` | Search endpoint returned an error response |
| `ERROR_SEARCH` | A non-library failure occurred while performing search |

## Demo

### Download a song to file

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";

async function main(): Promise<void> {
    try {
        const stream = await client.music("Z7ACBFEF");
        stream.pipe(fs.createWriteStream("song.mp3"));
    } catch (error) {
        if (error instanceof Lapse)
            console.error(error.code, error.message);
        else
            console.error(error);
    }
}

void main();
```

### Download a video stream to file

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";

async function main(): Promise<void> {
    const stream = await client.video("ZO8I9ZZC");
    stream.pipe(fs.createWriteStream("video.ts"));
}

void main();
```

### Search then download the first result

```ts
import fs from "node:fs";
import client from "@khang07/zing-mp3-api";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";

async function main(): Promise<void> {
    try {
        const results = await client.search("mở mắt");
        const first = results[0];

        if (!first)
            throw new Error("No result found");

        const stream = await client.music(first.id);
        stream.pipe(fs.createWriteStream(first.alias + ".mp3"));
    } catch (error) {
        if (error instanceof Lapse)
            console.error(error.code, error.message);
        else
            console.error(error);
    }
}

void main();
```

## CommonJS example

```js
const fs = require("node:fs");
const zing = require("@khang07/zing-mp3-api");

async function main() {
    const client = zing.default;
    const stream = await client.music("Z7ACBFEF");
    stream.pipe(fs.createWriteStream("track.mp3"));
}

main();
```

## Build

```bash
npm run build
```

Current scripts in the project:

```json
{
  "build:esm": "tsc -p tsconfig.json",
  "build:cjs": "rollup -c",
  "build": "rm -rf dist && bun run build:esm && bun run build:cjs && rm -fr dist/esm/types dist/cjs/types",
  "test": "mocha"
}
```

## Notes

- The default export is a preconfigured client instance.
- The named export is `ZingClient`.
- Search currently returns songs only.
- Video currently streams HLS `360p`.
- Errors are wrapped in `Lapse` for consistent handling.

## License

MIT
