import { statSync, createReadStream, ReadStream } from 'fs';
import { createBrotliCompress, createGzip, createDeflate } from 'zlib';
import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { writeHeaders } from './functions';
import { getMime } from './mime';
import { stob } from './functions';
import { Cache } from 'cache-manager';

const bytes = 'bytes=';

export type SendFileOptions = {
  filter?: (path: string) => boolean;
  lastModified?: boolean;
  headers?: { [key: string]: string };
  compress?: boolean;
  compressionOptions?: {
    priority?: ('gzip' | 'br' | 'deflate')[];
  };
  cache?: false | Cache;
};

export type Handler = (res: HttpResponse, req: HttpRequest) => void;

export const compressions = {
  br: createBrotliCompress,
  gzip: createGzip,
  deflate: createDeflate,
};

function sendFile(res: HttpResponse, req: HttpRequest, path: string, options: SendFileOptions): void {
  sendFileToRes(
    res,
    {
      'if-modified-since': req.getHeader('if-modified-since'),
      range: req.getHeader('range'),
      'accept-encoding': req.getHeader('accept-encoding'),
    },
    path,
    options,
  );
}

function sendFileToRes(
  res: HttpResponse,
  reqHeaders: { [name: string]: string },
  path: string,
  {
    lastModified = true,
    headers = {},
    compress = false,
    compressionOptions = {
      priority: ['gzip', 'br', 'deflate'],
    },
    cache = false,
  }: SendFileOptions,
) {
  const statsData = statSync(path);
  const { mtime } = statsData;
  let { size } = statsData;

  mtime.setMilliseconds(0);
  const mtimeutc = mtime.toUTCString();

  headers = Object.assign({}, headers);
  // handling last modified
  if (lastModified) {
    // Return 304 if last-modified
    if (reqHeaders['if-modified-since']) {
      if (new Date(reqHeaders['if-modified-since']) >= mtime) {
        res.writeStatus('304 Not Modified');
        return res.end();
      }
    }
    headers['last-modified'] = mtimeutc;
  }
  headers['content-type'] = getMime(path);

  // write data
  let start = 0,
    end = size - 1;

  if (reqHeaders.range) {
    compress = false;
    const parts = reqHeaders.range.replace(bytes, '').split('-');
    start = parseInt(parts[0], 10);
    end = parts[1] ? parseInt(parts[1], 10) : end;
    headers['accept-ranges'] = 'bytes';
    headers['content-range'] = `bytes ${start}-${end}/${size}`;
    size = end - start + 1;
    res.writeStatus('206 Partial Content');
  }

  // for size = 0
  if (end < 0) end = 0;

  let readStream = createReadStream(path, { start, end });
  // Compression;
  let compressed: boolean | string = false;
  if (
    compress &&
    compressionOptions &&
    typeof compressionOptions === 'object' &&
    compressionOptions.priority &&
    typeof compressionOptions.priority === 'object'
  ) {
    const { priority, ...options } = compressionOptions;
    const l = priority.length;

    for (let i = 0; i < l; i++) {
      const type = priority[i];

      if (reqHeaders['accept-encoding'].indexOf(type) > -1) {
        compressed = type;
        const compressor = compressions[type](options);
        readStream.pipe(compressor);
        readStream = (compressor as unknown) as ReadStream;
        headers['content-encoding'] = priority[i];
        break;
      }
    }
  }

  res.onAborted(() => readStream.destroy());
  writeHeaders(res, headers);
  // check cache
  if (cache) {
    return cache.wrap<Buffer>(
      `${path}_${mtimeutc}_${start}_${end}_${compressed}`,
      (cb: (error: unknown, result?: Buffer) => Promise<Buffer> | Buffer) => {
        stob(readStream)
          .then((b) => cb(null, b))
          .catch(cb);
      },
      { ttl: 0 },
      (err, buffer) => {
        if (err) {
          res.writeStatus('500 Internal server error');
          res.end();
          throw err;
        }
        res.end(buffer);
      },
    );
  } else if (compressed) {
    readStream.on('data', (buffer: Buffer) => {
      res.write(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    });
  } else {
    readStream.on('data', (buffer: Buffer) => {
      const chunk = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        lastOffset = res.getWriteOffset();

      // First try
      const [ok, done] = res.tryEnd(chunk, size);

      if (done) {
        readStream.destroy();
      } else if (!ok) {
        // pause because backpressure
        readStream.pause();

        // Save unsent chunk for later
        res.ab = chunk;
        res.abOffset = lastOffset;

        // Register async handlers for drainage
        res.onWritable((offset) => {
          const [ok, done] = res.tryEnd(res.ab.slice(offset - res.abOffset), size);
          if (done) {
            readStream.destroy();
          } else if (ok) {
            readStream.resume();
          }
          return ok;
        });
      }
    });
  }
  readStream
    .on('error', (e) => {
      res.writeStatus('500 Internal server error');
      res.end();
      readStream.destroy();
      throw e;
    })
    .on('end', () => {
      res.end();
    });
}

export default sendFile;
