# **@KHANG07/ZING-MP3-API**

A TypeScript library for working with [Zing MP3](https://zingmp3.vn) resources from Node.js.
It can search songs, videos, playlists, and artists; fetch detailed metadata;
and return readable streams for music and video playback or download.

For the source code, releases, and package metadata, visit the
[GitHub repository](https://github.com/GiaKhang1810/zing-mp3-api) and the
[npm package](https://www.npmjs.com/package/@khang07/zing-mp3-api).
Report bugs or request features in the
[issue tracker](https://github.com/GiaKhang1810/zing-mp3-api/issues).


## Table of contents

- [Requirement](#requirements)
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

This package has no special runtime requirements beyond a modern Node.js
environment and network access to [Zing MP3](https://zingmp3.vn).

Project dependencies:

- [axios](https://www.npmjs.com/package/axios)
- [m3u8stream](https://www.npmjs.com/package/m3u8stream)

Development tooling used by the project:

- [@types/node](https:/t/www.npmjs.com/package/@types/node)
- [mocha](https://www.npmjs.com/package/mocha)
- [rollup](https://www.npmjs.com/package/rollup)
- [typescript](https://www.npmjs.com/package/typescript)


## Installation

Install the package with npm:

```bash
npm install @khang07/zing-mp3-api
```

Build the project from source:

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

The library works out of the box with the default exported client.
If you need more control, create a `Client` instance with custom options.

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

`ClientOptions` fields:

- `maxLoad`: request rate limit passed to Axios as `maxRate`
- `maxHighWaterMark`: stream buffer size used by `musicSync()` and `videoSync()`
- `userAgent`: custom request user-agent string
- `jar`: custom cookie jar instance

There is no additional post-install configuration required.
The client automatically fetches and stores cookies before protected requests.


## Usage

### ESM

```ts
import client, { Client } from "@khang07/zing-mp3-api";
```

### CommonJS

```js
const client = require("@khang07/zing-mp3-api");
const { Client } = client;
```

### Search for songs

```ts
import client from "@khang07/zing-mp3-api";

const items = await client.searchMusic("Skyfall");
console.log(items[0]);
```

### Fetch playlist details

```ts
import client from "@khang07/zing-mp3-api";

const playlist = await client.playlist(
    "https://zingmp3.vn/album/example/ZWZB9WAB.html"
);

console.log(playlist.name);
console.log(playlist.mediaCount);
```

### Fetch artist details

```ts
import client from "@khang07/zing-mp3-api";

const artist = await client.artist("https://zingmp3.vn/Obito");

console.log(artist.name);
console.log(artist.followCount);
```

### Download a music stream

```ts
import { createWriteStream } from "node:fs";
import client from "@khang07/zing-mp3-api";

const items = await client.searchMusic("Example");
const stream = await client.music(items[0].id);

stream.pipe(createWriteStream("music.mp3"));
```

### Download a video stream

```ts
import { createWriteStream } from "node:fs";
import client from "@khang07/zing-mp3-api";

const items = await client.searchVideo("Example");
const stream = await client.video(items[0].id);

stream.pipe(createWriteStream("video.ts"));
```

### Use the immediate stream APIs

```ts
import { createWriteStream } from "node:fs";
import client from "@khang07/zing-mp3-api";

const stream = client.musicSync("Example ID");
stream.pipe(createWriteStream("music.mp3"));
```

### Handle library errors

```ts
import client from "@khang07/zing-mp3-api";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";

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

| Method | Returns | Description |
| --- | --- | --- |
| `video(videoID)` | `Promise<Readable>` | Fetch a video stream from a raw ID, URL string, or `URL` object. |
| `videoSync(videoID)` | `Readable` | Return a `PassThrough` immediately and pipe the resolved video stream into it. |
| `music(musicID)` | `Promise<Readable>` | Fetch a music stream from a raw ID, URL string, or `URL` object. |
| `musicSync(musicID)` | `Readable` | Return a `PassThrough` immediately and pipe the resolved music stream into it. |
| `playlist(playlistID)` | `Promise<PlayList>` | Fetch playlist details. |
| `artist(aliasID)` | `Promise<Artist>` | Fetch artist details. |
| `mediaDetails(mediaID)` | `Promise<Media>` | Fetch song details. |
| `searchMusic(query)` | `Promise<SearchMedia[]>` | Search songs. |
| `searchVideo(query)` | `Promise<SearchMedia[]>` | Search videos. |
| `searchList(query)` | `Promise<SearchPlayList[]>` | Search playlists. |
| `searchArtist(query)` | `Promise<SearchArtist[]>` | Search artists. |

### Method notes

- `video()` prefers `720p` and falls back to `360p`
- `music()` prefers `320kbps` when available and falls back to `128kbps`
- If the main music endpoint returns a VIP-only response, `music()` retries the
  extra music endpoint before throwing `ERROR_MUSIC_VIP_ONLY`
- Search methods currently request the first page with `count: 20`
- `musicSync()` and `videoSync()` forward stream failures to the returned
  `PassThrough` and destroy the source stream when the output is closed

### Data types

Public type exports from the root entry:

- `ClientOptions`
- `Artist`
- `Media`
- `PlayList`
- `SearchArtist`
- `SearchMedia`
- `SearchPlayList`


## Public exports

### Root export

Runtime exports:

- `default`: a ready-to-use `Client` instance
- `Client`: the client class
- `Cookies`: the cookies class
- `createSignature`: signature function
- `Lapse`: the custom error class

Type exports:

- `ClientOptions`
- `Artist`
- `Media`
- `PlayList`
- `SearchArtist`
- `SearchMedia`
- `SearchPlayList`

### Public utility subpaths

```ts
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";
import { createSignature } from "@khang07/zing-mp3-api/utils/encrypt";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";
```

### `Cookies` helper

Methods:

- `setCookie(setCookie, requestUrl)`
- `setCookies(setCookies, requestUrl)`
- `getCookies(requestUrl)`
- `getCookieHeader(requestUrl)`
- `applyToHeaders(requestUrl, headers?)`
- `deleteCookie(domain, path, name)`
- `cleanup()`
- `toJSON()`
- `fromJSON(cookies)`

Cookie record shape:

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
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";

const jar = new Cookies();
jar.setCookie("sid=abc; Path=/; HttpOnly", "https://zingmp3.vn/");

console.log(jar.getCookieHeader("https://zingmp3.vn/"));
```


## Error handling

The library throws `Lapse`, a custom error type with the following fields:

- `name`
- `message`
- `code`
- `status`
- `cause`

Known library error codes:

- `ERROR_ARTIST_FETCH`
- `ERROR_ARTIST_NOT_FOUND`
- `ERROR_INVALID_ID`
- `ERROR_INVALID_QUERY`
- `ERROR_INVALID_URL`
- `ERROR_MEDIA_FETCH`
- `ERROR_MEDIA_NOT_FOUND`
- `ERROR_MUSIC_FETCH`
- `ERROR_MUSIC_VIP_ONLY`
- `ERROR_PLAYLIST_FETCH`
- `ERROR_PLAYLIST_NOT_FOUND`
- `ERROR_SEARCH_FAILED`
- `ERROR_SEARCH_FETCH`
- `ERROR_STREAM_DOWNLOAD`
- `ERROR_STREAM_URL_NOT_FOUND`
- `ERROR_VIDEO_FETCH`
- `ERROR_VIDEO_NOT_FOUND`


## Troubleshooting & FAQ

### `video()` returns a stream, but saved files do not open as MP4

Video playback is fetched from an HLS source via `m3u8stream`. If you write the
stream directly to disk, save it as a transport-stream style output such as
`.ts`, or post-process it with your own media pipeline.

### Music lookup fails with `ERROR_MUSIC_VIP_ONLY`

Some tracks are restricted. The client already retries the fallback music
endpoint, but a playable URL may still be unavailable.

### I want to reuse cookies between sessions

Use `jar.toJSON()` to persist cookies and `jar.fromJSON()` to restore them.
This is useful if you want to avoid starting from an empty cookie jar each time.

### Input URLs fail with `ERROR_INVALID_URL`

Use either a standard Zing MP3 HTML URL such as
`https://zingmp3.vn/bai-hat/test/ZWZB9WAB.html` or a root-style artist URL such
as `https://zingmp3.vn/mono`.


## Maintainers

- GiaKhang - [GiaKhang1810](https://github.com/GiaKhang1810)


## License

This project is licensed under the MIT License.
See the [LICENSE](./LICENSE) file for details.
