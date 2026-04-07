# `@khang07/zing-mp3-api`

The basic APIs provide the features of ZingMp3.

## Features

* Search songs, videos, playlists, and artists
* Fetch playlist, artist, and song details
* Get readable streams for music and video
* Accept raw resource tokens or `URL` values for resource-based methods
* Provide a cookie jar utility through a public subpath export
* Ship ESM and CommonJS entry points

## Installation

```bash
npm install @khang07/zing-mp3-api
```

## Public Exports

### Root export

#### Runtime exports

* `default`: a pre-created `Client` instance
* `Client`: the client class

#### Type exports

* `ClientOptions`
* `PlayList`
* `Artist`
* `Media`
* `SearhMedia`
* `SearchPlayList`
* `Cookies` *(type-only export from the root entry)*

### Public subpath exports

```ts
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";
import { createSignature } from "@khang07/zing-mp3-api/utils/encrypt";
import { Lapse } from "@khang07/zing-mp3-api/utils/lapse";
```

## Import

### ESM

```ts
import client, { Client } from "@khang07/zing-mp3-api";
```

### CommonJS

```js
const zing = require("@khang07/zing-mp3-api");

const client = zing.default;
const { Client } = zing;
```

## Basic Usage

### Use the default client

```ts
import client from "@khang07/zing-mp3-api";

const items = await client.searchMusic("Do For Love Bray");
console.log(items[0]);
```

### Create a client

```ts
import { Client } from "@khang07/zing-mp3-api";
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";

const client = new Client({
    maxLoad: 16 * 1024,
    maxHighWaterMark: 16 * 1024,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    jar: new Cookies()
});
```

### Fetch a playlist from a URL

```ts
import client from "@khang07/zing-mp3-api";

const playlist = await client.playlist("https://zingmp3.vn/album/example/ZWZB9WAB.html");
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

const items = await client.searchMusic("Do For Love Bray");
const stream = await client.music(items[0].id);

stream.pipe(createWriteStream("music.mp3"));
```

### Download a video stream

```ts
import { createWriteStream } from "node:fs";
import client from "@khang07/zing-mp3-api";

const items = await client.searchVideo("Do For Love Bray");
const stream = await client.video(items[0].id);

stream.pipe(createWriteStream("video.ts"));
```

### Use the immediate stream-returning methods

```ts
import { createWriteStream } from "node:fs";
import client from "@khang07/zing-mp3-api";

const stream = client.musicSync("ZWZB9WAB");
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
    }
}
```

## API Reference

## `new Client(options?)`

Creates a new client instance.

### `ClientOptions`

| Field              | Type      | Default                                                                                                              |
| ------------------ | --------- | -------------------------------------------------------------------------------------------------------------------- |
| `maxLoad`          | `number`  | `1024 * 1024`                                                                                                          |
| `maxHighWaterMark` | `number`  | `16 * 1024`                                                                                                            |
| `userAgent`        | `string`  | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3` |
| `jar`              | `Cookies` | `new Cookies()`                                                                                                      |

`maxLoad` is passed to Axios as `maxRate`.

`maxHighWaterMark` is used as the `highWaterMark` when `musicSync()` and `videoSync()` create a `PassThrough` stream.

## `Client.getIDFromURL(url)`

```ts
static getIDFromURL(url: string): string
```

Extracts a resource token from a ZingMp3 URL.

It throws `ERROR_INVALID_URL` when the input is not a non-empty string or when no token can be extracted.

## Instance Methods

| Method                  | Returns                                                                                                           | Description                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `video(videoID)`        | `Promise<Readable>`                                                                                               | Fetches a video stream. Accepts a raw token, URL string, or `URL`.              |
| `videoSync(videoID)`    | `Readable`                                                                                                        | Returns a `PassThrough` immediately and pipes the fetched video stream into it. |
| `music(musicID)`        | `Promise<Readable>`                                                                                               | Fetches a music stream. Accepts a raw token, URL string, or `URL`.              |
| `musicSync(musicID)`    | `Readable`                                                                                                        | Returns a `PassThrough` immediately and pipes the fetched music stream into it. |
| `playlist(playlistID)`  | `Promise<PlayList>`                                                                                               | Fetches playlist details. Accepts a raw token, URL string, or `URL`.            |
| `artist(aliasID)`       | `Promise<Artist>`                                                                                                 | Fetches artist details. Accepts an alias token, URL string, or `URL`.           |
| `mediaDetails(mediaID)` | `Promise<Media>`                                                                                                  | Fetches song details. Accepts a raw token, URL string, or `URL`.                |
| `searchMusic(query)`    | `Promise<SearhMedia[]>`                                                                                                | Searches songs.                                                                 |
| `searchVideo(query)`    | `Promise<SearhMedia[]>`                                                                                           | Searches videos.                                                                |
| `searchList(query)`     | `Promise<SearchPlayList[]>`                                                                                       | Searches playlists.                                                             |
| `searchArtist(query)`   | `Promise<SearchArtist[]>` | Searches artists.                                                               |

### Method notes

* `video()` selects `720p` first, then falls back to `360p`.
* `music()` selects `320` first when available and not equal to `"VIP"`, then falls back to `128`.
* When the music API returns `err === -1150`, `music()` retries the extra music endpoint up to 4 times and throws `ERROR_MUSIC_VIP_ONLY` if it still cannot resolve a playable URL.
* `searchMusic()`, `searchVideo()`, `searchList()`, and `searchArtist()` always request `page: 1` and `count: 20`.

## Public Types

### `Artist`

```ts
interface Artist {
    alias: string;
    birthday: string;
    biography: string;
    followCount: number;
    name: string;
    national: string;
    realname: string;
    thumbnail: {
        w240: string;
        w600: string;
    };
}
```

### `Media`

```ts
interface Media {
    id: string;
    name: string;
    alias: string;
    isOffical: boolean;
    username: string;
    artists: Array<{
        alias: string;
        followCount?: number;
        name: string;
        thumbnail: {
            w240: string;
            w600: string;
        };
    }>;
    isWorldWide: boolean;
    thumbnail: {
        w94: string;
        w240: string;
    };
    duration: number;
    isPrivate: boolean;
    releaseDate: number;
    album: {
        id: string;
        name: string;
        isOffical: boolean;
        releaseDate: string;
        releasedAt: number;
        artists: Array<{
            alias: string;
            followCount?: number;
            name: string;
            thumbnail: {
                w240: string;
                w600: string;
            };
        }>;
        thumbnail: {
            w165: string;
        };
    };
    hasLyric: boolean;
}
```

### `SearhMedia`

```ts
type SearchMedia = Omit<Media, 'album' | 'isPrivate' | 'releaseDate'>;
```

### `PlayList`

```ts
interface PlayList {
    id: string;
    name: string;
    alias: string;
    artists: Array<{
        alias: string;
        followCount?: number;
        name: string;
        thumbnail: {
            w240: string;
            w600: string;
        };
    }>;
    description: string;
    duration: number;
    isOffical: boolean;
    isPrivate: boolean;
    isSingle: boolean;
    likeCount: number;
    listenCount: number;
    media: Media[];
    mediaCount: number;
    releaseDate: string;
    releasedAt: number;
    thumbnail: {
        w165: string;
        w320: string;
    };
    updatedAt: number;
}
```

### `SearchPlayList`

```ts
type SearchPlayList = Omit<
    PlayList,
    "updatedAt" | "mediaCount" | "listenCount" | "likeCount" | "duration" | "description" | "media"
>;
```

## `Cookies`

Import from `@khang07/zing-mp3-api/utils/cookies`.

### Methods

| Method                                 | Returns                  |
| -------------------------------------- | ------------------------ |
| `setCookie(setCookie, requestUrl)`     | `void`                   |
| `setCookies(setCookies, requestUrl)`   | `void`                   |
| `getCookies(requestUrl)`               | `CookieRecord[]`         |
| `getCookieHeader(requestUrl)`          | `string`                 |
| `applyToHeaders(requestUrl, headers?)` | `Record<string, string>` |
| `deleteCookie(domain, path, name)`     | `void`                   |
| `cleanup()`                            | `void`                   |
| `toJSON()`                             | `CookieRecord[]`         |
| `fromJSON(cookies)`                    | `void`                   |

### Cookie record shape

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

### Example

```ts
import { Cookies } from "@khang07/zing-mp3-api/utils/cookies";

const jar = new Cookies();
jar.setCookie("sid=abc; Path=/; HttpOnly", "https://zingmp3.vn/");

console.log(jar.getCookieHeader("https://zingmp3.vn/"));
```

## `createSignature(uri, params, secret)`

Import from `@khang07/zing-mp3-api/utils/encrypt`.

```ts
function createSignature(uri: string, params: string, secret: string): string
```

Generates the request signature used by the client.

## `Lapse`

Import from `@khang07/zing-mp3-api/utils/lapse`.

```ts
class Lapse extends Error {
    code: string;
    status?: number;
    cause?: unknown;
}
```

### Constructor

```ts
new Lapse(message: string, code: string, status?: number, cause?: unknown)
```

### Properties

* `name`: always set to `"ZING_MP3_ERROR"`
* `message`: inherited from `Error`
* `code`: library error code
* `status`: optional status or API error value
* `cause`: optional original error or response payload

## Error Codes

| Code                         | Used by                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `ERROR_INVALID_URL`          | `Client.getIDFromURL()`                                            |
| `ERROR_INVALID_ID`           | `video()`, `music()`, `playlist()`, `artist()`, `mediaDetails()`   |
| `ERROR_INVALID_QUERY`        | `searchMusic()`, `searchVideo()`, `searchList()`, `searchArtist()` |
| `ERROR_VIDEO_NOT_FOUND`      | `video()`                                                          |
| `ERROR_VIDEO_FETCH`          | `video()`, `videoSync()`                                           |
| `ERROR_MUSIC_VIP_ONLY`       | `music()`                                                          |
| `ERROR_MUSIC_FETCH`          | `music()`, `musicSync()`                                           |
| `ERROR_PLAYLIST_NOT_FOUND`   | `playlist()`                                                       |
| `ERROR_PLAYLIST_FETCH`       | `playlist()`                                                       |
| `ERROR_ARTIST_NOT_FOUND`     | `artist()`                                                         |
| `ERROR_ARTIST_FETCH`         | `artist()`                                                         |
| `ERROR_MEDIA_NOT_FOUND`      | `mediaDetails()`                                                   |
| `ERROR_MEDIA_FETCH`          | `mediaDetails()`                                                   |
| `ERROR_SEARCH_FAILED`        | `searchMusic()`, `searchVideo()`, `searchList()`, `searchArtist()` |
| `ERROR_SEARCH_FETCH`         | `searchMusic()`, `searchVideo()`, `searchList()`, `searchArtist()` |
| `ERROR_STREAM_URL_NOT_FOUND` | `video()`, `music()`                                               |
| `ERROR_STREAM_DOWNLOAD`      | `video()`, `videoSync()`, `music()`, `musicSync()`                 |

## Notes

* The root entry exports `Cookies` as a type only. To construct a cookie jar, import `Cookies` from `@khang07/zing-mp3-api/utils/cookies`.
* The root entry exports the type name `SearhMedia` exactly as written in source.
* `searchArtist()` is a public method, but its `SearchArtist` type is not re-exported from the root entry.
* No test, example, or demo files were included in the provided source bundle.

## License
[MIT](https://github.com/GiaKhang1810/zing-mp3-api?tab=MIT-1-ov-file)