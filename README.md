# @khang07/zing-mp3-api

Node.js library để lấy stream nhạc và video từ Zing MP3 dưới dạng `Readable` stream.

Package này hiện tập trung vào 2 tác vụ chính:

- Lấy **nhạc** theo ID và trả về stream audio
- Lấy **video** theo ID và trả về stream video HLS

Library build sẵn cho cả **ESM** và **CommonJS**, có type cho TypeScript.

## Tính năng

- Export sẵn `client` dùng ngay
- Có thể tự tạo `new Client()` để chỉnh tốc độ stream/buffer
- Trả về `Readable` stream để pipe thẳng ra file, HTTP response, Discord voice pipeline, hoặc xử lý tiếp
- Có cookie jar nội bộ để giữ cookie giữa các request
- Có chữ ký request nội bộ cho API đang dùng
- Hỗ trợ ESM, CJS, TypeScript

## Cài đặt

```bash
npm install @khang07/zing-mp3-api
```

hoặc

```bash
bun add @khang07/zing-mp3-api
```

## Yêu cầu môi trường

Package này chạy cho **Node.js**, không dành cho browser vì dùng:

- `node:stream`
- `node:crypto`
- `axios` với Node adapter
- `m3u8stream`

## Dùng nhanh

### ESM

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

const writer = createWriteStream("music.mp3");
const stream = await client.music("MUSIC_ID");

stream.pipe(writer);
```

### ESM với named import

```ts
import { client, Client } from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

const musicWriter = createWriteStream("music.mp3");
client.musicSyncLike("MUSIC_ID").pipe(musicWriter);

const customClient = new Client({
    maxRate: [256 * 1024, 64 * 1024]
});

const videoWriter = createWriteStream("video.bin");
const videoStream = await customClient.video("VIDEO_ID");
videoStream.pipe(videoWriter);
```

### CommonJS

```js
const { client, Client } = require("@khang07/zing-mp3-api");
const { createWriteStream } = require("node:fs");

const writer = createWriteStream("music.mp3");
client.musicSyncLike("MUSIC_ID").pipe(writer);
```

## API

### `new Client(options?)`

Tạo client mới.

```ts
import { Client } from "@khang07/zing-mp3-api";

const client = new Client({
    maxRate: [100 * 1024, 16 * 1024]
});
```

#### `ClientOptions`

```ts
interface ClientOptions {
    maxRate?: [download?: number, highWaterMark?: number];
}
```

Ý nghĩa:

- `download`: giới hạn tốc độ download cho request stream
- `highWaterMark`: buffer size cho `PassThrough` của các hàm `SyncLike`

Giá trị mặc định:

```ts
[100 * 1024, 16 * 1024]
```

## Các method

### `await client.music(musicID)`

Trả về `Promise<Readable>` cho audio stream.

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

const output = createWriteStream("music.mp3");
const stream = await client.music("ZZEEOZEC");

stream.pipe(output);
```

Ghi chú:

- Method này gọi API `/api/v2/song/get/streaming`
- Hiện tại code lấy URL tại `data[128]`
- Nghĩa là implementation hiện tại đang dùng nhánh stream **128 kbps**

### `client.musicSyncLike(musicID)`

Trả về `Readable` ngay để có thể pipe trực tiếp, phù hợp khi bạn muốn viết ngắn hơn.

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

client.musicSyncLike("ZZEEOZEC").pipe(createWriteStream("music.mp3"));
```

### `await client.video(videoID)`

Trả về `Promise<Readable>` cho video stream.

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

const output = createWriteStream("video.bin");
const stream = await client.video("ZZEEOZEC");

stream.pipe(output);
```

Ghi chú quan trọng:

- Method này gọi API `/api/v2/page/get/video`
- Hiện tại code chỉ lấy `streaming.hls["360p"]`
- Đây là **HLS stream** lấy qua `m3u8stream`
- Library **không transcode**, **không remux**, **không ép sang MP4 thật**
- Vì vậy bạn nên xem dữ liệu trả về là **stream media thô từ HLS**, không nên mặc định coi nó luôn là file `.mp4` chuẩn

### `client.videoSyncLike(videoID)`

Trả về `Readable` ngay để pipe trực tiếp.

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

client.videoSyncLike("ZZEEOZEC").pipe(createWriteStream("video.bin"));
```

## Bắt lỗi

Khi có lỗi, code ném ra error với các field thực tế đang có trong implementation:

- `name`: `ZING_MP3_ERROR`
- `message`
- `code`
- `status` (nếu có)
- `cause` (nếu có)

Các mã lỗi đang xuất hiện trong source:

- `ERROR_INVALID_ID`
- `ERROR_MUSIC_NOT_FOUND`
- `ERROR_MUSIC_VIP_ONLY`
- `ERROR_VIDEO_NOT_FOUND`
- `ERROR_STREAM_URL_NOT_FOUND`
- `ERROR_STREAM_DOWNLOAD`
- `ERROR_MUSIC_FETCH`
- `ERROR_VIDEO_FETCH`

Ví dụ:

```ts
import client from "@khang07/zing-mp3-api";
import { createWriteStream } from "node:fs";

try {
    const stream = await client.music("ZZEEOZEC");
    const writer = createWriteStream("music.mp3");

    stream.on("error", (error) => {
        console.error("Stream error:", error);
    });

    writer.on("error", (error) => {
        console.error("Write error:", error);
    });

    stream.pipe(writer);
} catch (error) {
    console.error(error);
}
```

## Dùng với HTTP server

```ts
import http from "node:http";
import client from "@khang07/zing-mp3-api";

const server = http.createServer(async (_req, res) => {
    try {
        const stream = await client.music("ZZEEOZEC");

        res.writeHead(200, {
            "Content-Type": "audio/mpeg"
        });

        stream.on("error", () => {
            if (!res.headersSent)
                res.writeHead(500);

            res.end("Stream failed");
        });

        stream.pipe(res);
    } catch {
        res.writeHead(500);
        res.end("Failed to fetch music");
    }
});

server.listen(3000);
```

## Build từ source

Project đang dùng TypeScript + Rollup + API Extractor.

```bash
bun install
bun run build
```

Output build:

- `dist/esm` → bản ESM
- `dist/cjs` → bản CommonJS
- `dist/types` → type declarations gộp

Các script hiện có:

```bash
bun run build:esm
bun run build:cjs
bun run build:types
bun run build
```

## Cấu trúc dự án

```text
source/
  index.ts
  types/
  utils/
dist/
  esm/
  cjs/
  types/
```

## Ghi chú triển khai hiện tại

Có vài điểm cần lưu ý:

- Chưa có API search public trong `Client` dù đang export type `SearchCategory`
- Video hiện mới lấy nhánh `360p`
- Music hiện mới lấy nhánh `128kps`
- Package phụ thuộc vào cấu trúc API/cookie/signature hiện tại của Zing MP3, nên nếu upstream đổi thì cần cập nhật source

## Ghi chú về file test trong repo

Trong repo hiện có `test/index.js` và `test/index.cjs`, nhưng chúng đang import từ `"zing-mp3-api"`.

Khi publish theo `package.json` hiện tại, import đúng cho người dùng ngoài sẽ là:

```js
import { client } from "@khang07/zing-mp3-api";
```

hoặc:

```js
const { client } = require("@khang07/zing-mp3-api");
```

## License

Xem tại [LICENSE](https://github.com/GiaKhang1810/zing-mp3-api#license)
