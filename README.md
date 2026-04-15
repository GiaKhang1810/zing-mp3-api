
![ @KHANG07/ZING-MP3-API ](https://socialify.git.ci/GiaKhang1810/zing-mp3-api/image?font=Raleway&language=1&owner=1&stargazers=1&theme=Dark)

A TypeScript library for working with [Zing MP3](https://zingmp3.vn) resources from Node.js.
It supports searching songs, videos, playlists, and artists; fetching metadata;
and returning readable streams for music and video playback or download.

For source code, releases, and package metadata, see the
[GitHub repository](https://github.com/GiaKhang1810/zing-mp3-api) and the
[npm package](https://www.npmjs.com/package/@khang07/zing-mp3-api).
Report bugs or request features in the
[issue tracker](https://github.com/GiaKhang1810/zing-mp3-api/issues).

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API reference](#api-reference)
- [Public exports](#public-exports)
- [Error handling](#error-handling)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Maintainers](#maintainers)
- [License](#license)

## Requirements

This package requires a modern Node.js environment and network access to
[Zing MP3](https://zingmp3.vn).

Project dependencies:

- [axios](https://www.npmjs.com/package/axios)
- [m3u8stream](https://www.npmjs.com/package/m3u8stream)

Development dependencies:

- [@types/node](https://www.npmjs.com/package/@types/node)
- [mocha](https://www.npmjs.com/package/mocha)
- [rollup](https://www.npmjs.com/package/rollup)
- [typescript](https://www.npmjs.com/package/typescript)

## Installation

```bash
npm install @khang07/zing-mp3-api
````

Build from source:

```bash
npm run build
```

Run tests:

```bash
npm test
```

Run live integration tests:

```bash
ZING_MP3_LIVE=1 npm test
```

## Configuration

Use the default exported client for quick access, or create a custom `Client`
instance when you need to override options.

### Create a custom client

```ts
import { Client, Cookies } from "@khang07/zing-mp3-api";

const client = new Client({
    maxLoad: 1024 * 1024,
    maxHighWaterMark: 16 * 1024,
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    jar: new Cookies()
});
```

### Update the default client

```ts
import client from "@khang07/zing-mp3-api";

client.setOptions({
    maxLoad: 1024 * 1024,
    maxHighWaterMark: 16 * 1024,
    userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    jar: client.getJar()
});
```

`ClientOptions`:

* `maxLoad`: request rate limit passed to Axios as `maxRate`
* `maxHighWaterMark`: stream buffer size used by `musicSync()` and `videoSync()`
* `userAgent`: custom request user-agent string
* `jar`: custom cookie jar instance

The client automatically fetches and stores cookies before protected requests.

## Usage

### ESM

```ts
import client, { Client } from "@khang07/zing-mp3-api";
```

### CommonJS

```js
const { default: client, Client } = require("@khang07/zing-mp3-api");
```

### Search songs

```ts
const items = await client.searchMusic("Skyfall");
console.log(items[0]);
```

### Fetch playlist details

```ts
const playlist = await client.playlist(
    "https://zingmp3.vn/album/example/ZWZB9WAB.html"
);

console.log(playlist.name);
console.log(playlist.mediaCount);
```

### Fetch artist details

```ts
const artist = await client.artist("https://zingmp3.vn/Obito");

console.log(artist.name);
console.log(artist.followCount);
```

### Download a music stream

```ts
import { createWriteStream } from "node:fs";

const items = await client.searchMusic("Example");
const stream = await client.music(items[0].id);

stream.pipe(createWriteStream("music.mp3"));
```

### Download a video stream

```ts
import { createWriteStream } from "node:fs";

const items = await client.searchVideo("Example");
const stream = await client.video(items[0].id);

stream.pipe(createWriteStream("video.ts"));
```

### Use the immediate stream APIs

```ts
import { createWriteStream } from "node:fs";

const stream = client.musicSync("Example ID");
stream.pipe(createWriteStream("music.mp3"));
```

### Handle library errors

```ts
import client, { Lapse } from "@khang07/zing-mp3-api";

try {
    await client.playlist("");
} catch (error) {
    if (error instanceof Lapse) {
        console.error(error.name);
        console.error(error.code);
        console.error(error.status);
        console.error(error.cause);
    }
}
```

## API reference

### `new Client(options?)`

Creates a new client instance.

### `Client.getIDFromURL(url)`

Extracts a resource token or alias from a Zing MP3 URL.
Throws `ERROR_INVALID_URL` when the input is empty or unsupported.

### Instance methods

| Method                  | Returns                     | Description                                                                      |
| ----------------------- | --------------------------- | -------------------------------------------------------------------------------- |
| `getJar()`              | `Cookies`                   | Returns the current cookie jar.                                                  |
| `setOptions(options?)`  | `void`                      | Updates client options.                                                          |
| `video(videoID)`        | `Promise<Readable>`         | Fetches a video stream from an ID, URL string, or `URL` object.                  |
| `videoSync(videoID)`    | `Readable`                  | Returns a `PassThrough` immediately and pipes the resolved video stream into it. |
| `music(musicID)`        | `Promise<Readable>`         | Fetches a music stream from an ID, URL string, or `URL` object.                  |
| `musicSync(musicID)`    | `Readable`                  | Returns a `PassThrough` immediately and pipes the resolved music stream into it. |
| `playlist(playlistID)`  | `Promise<PlayList>`         | Fetches playlist details.                                                        |
| `artist(aliasID)`       | `Promise<Artist>`           | Fetches artist details.                                                          |
| `mediaDetails(mediaID)` | `Promise<Media>`            | Fetches song details.                                                            |
| `search(query, type)`   | `Promise<SearchObj[type][]>`| Searches.                                                                        |
| `releaseChart()`        | `Promise<MediaChart[]>`     | Gets the latest ranking list.                                                    |

### Method notes

* `video()` prefers `720p` and falls back to `360p`
* `music()` prefers `320kbps` and falls back to `128kbps`
* if the main music endpoint returns VIP-only data, `music()` retries the extra endpoint before throwing `ERROR_MUSIC_VIP_ONLY`
* search methods currently request the first page with `count: 20`
* `musicSync()` and `videoSync()` forward stream failures to the returned `PassThrough` and destroy the source stream when the output is closed

## Public exports

### Runtime exports

* `default`: ready-to-use `Client` instance
* `Client`: client class
* `Cookies`: cookie jar class
* `createSignature`: signature function
* `Lapse`: custom error class

### Type exports

* `ClientOptions`
* `Artist`
* `Media`
* `PlayList`
* `SearchArtist`
* `SearchMedia`
* `SearchPlayList`
* `MediaChart`

### `Cookies` helper

Methods:

* `setCookie(setCookie, requestUrl)`
* `setCookies(setCookies, requestUrl)`
* `getCookies(requestUrl)`
* `getCookieHeader(requestUrl)`
* `applyToHeaders(requestUrl, headers?)`
* `deleteCookie(domain, path, name)`
* `cleanup()`
* `toJSON()`
* `fromJSON(cookies)`

```ts
interface CookieRecord {
    name: string;
    value: string;
    domain: string;
    path: string;
    expiresAt?: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    hostOnly: boolean;
}
```

Example:

```ts
import { Cookies } from "@khang07/zing-mp3-api";

const jar = new Cookies();
jar.setCookie("sid=abc; Path=/; HttpOnly", "https://zingmp3.vn/");

console.log(jar.getCookieHeader("https://zingmp3.vn/"));
```

## Error handling

The library throws `Lapse`, a custom error type with these fields:

* `name`
* `message`
* `code`
* `status`
* `cause`

Known error codes:

* `ERROR_ARTIST_FETCH`
* `ERROR_ARTIST_NOT_FOUND`
* `ERROR_INVALID_ID`
* `ERROR_INVALID_QUERY`
* `ERROR_INVALID_TYPE`
* `ERROR_INVALID_URL`
* `ERROR_MEDIA_FETCH`
* `ERROR_MEDIA_NOT_FOUND`
* `ERROR_MUSIC_FETCH`
* `ERROR_MUSIC_VIP_ONLY`
* `ERROR_PLAYLIST_FETCH`
* `ERROR_PLAYLIST_NOT_FOUND`
* `ERROR_SEARCH_FAILED`
* `ERROR_SEARCH_FETCH`
* `ERROR_STREAM_DOWNLOAD`
* `ERROR_STREAM_URL_NOT_FOUND`
* `ERROR_VIDEO_FETCH`
* `ERROR_VIDEO_NOT_FOUND`
* `ERROR_RELEASE_CHART_FETCH`

## Troubleshooting & FAQ

### `video()` returns a stream, but saved files do not open as MP4

Video playback is fetched from an HLS source via `m3u8stream`. If you write the
stream directly to disk, save it as `.ts` or post-process it with your own media pipeline.

### Music lookup fails with `ERROR_MUSIC_VIP_ONLY`

Some tracks are restricted. The fallback endpoint may still return no playable URL.

### I want to reuse cookies between sessions

Use `jar.toJSON()` to persist cookies and `jar.fromJSON()` to restore them.

### Input URLs fail with `ERROR_INVALID_URL`

Use a standard Zing MP3 HTML URL such as
`https://zingmp3.vn/bai-hat/test/ZWZB9WAB.html` or a root-style artist URL such as
`https://zingmp3.vn/mono`.

## Maintainers

* GiaKhang - [GiaKhang1810](https://github.com/GiaKhang1810)

## License

This project is licensed under the MIT License.
See the [LICENSE](./LICENSE) file for details.
