import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { ReadStream } from 'fs';
import parseHeaders from 'parse-headers';
import { parse as parseQuery } from 'qs';
import { createWriteStream, WriteStream } from 'fs';
import { join, dirname } from 'path';
import Busboy from 'busboy';
import mkdirp from 'mkdirp';
import { isObject, merge, set } from 'lodash';
import { finished, Readable } from 'stream';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

function writeHeaders(res: HttpResponse, headers: { [name: string]: string } | string, other?: string): void {
  if (typeof headers === 'string' && typeof other === 'string') {
    res.writeHeader(headers, other.toString());
  } else if (typeof headers === 'object') {
    for (const n in headers) {
      res.writeHeader(n, headers[n].toString());
    }
  }
}

function stob(stream: ReadStream): Promise<Buffer> {
  return new Promise((resolve) => {
    const buffers: Buffer[] = [];
    stream.on('data', buffers.push.bind(buffers));

    stream.on('end', () => {
      switch (buffers.length) {
        case 0:
          resolve(Buffer.allocUnsafe(0));
          break;
        case 1:
          resolve(buffers[0]);
          break;
        default:
          resolve(Buffer.concat(buffers));
      }
    });
  });
}

export type ParseDataOptions = {
  namespace?: string;
  headers?: boolean;
  body?: boolean;
  query?: boolean;
  path?: boolean;
  method?: boolean;
  bodyOptions?: busboy.BusboyConfig;
};

export type BodyType = {
  [key: string]: unknown;
};

export type ParsedData = {
  headers?: {
    [key: string]: string | string[];
  };
  body?: BodyType;
  query?: {
    [key: string]: unknown;
  };
  path?: string;
  method?: string;
};

async function parseData(req: HttpRequest, res: HttpResponse, options: ParseDataOptions): Promise<ParsedData> {
  let isAborted = false;
  res.onAborted(() => {
    isAborted = true;
    console.log('Request aborted');
  });

  const out: ParsedData = {};
  if (isAborted) return out;

  if ((typeof options.headers === 'boolean' && options.headers === true) || options.body === true) {
    const headers: string[] = [];
    req.forEach((key, value) => {
      headers.push(`${key}: ${value}`);
    });

    out.headers = parseHeaders(headers);
  }

  if (typeof options.query === 'boolean' && options.query === true) {
    out.query = parseQuery(req.getQuery());
  }

  if (typeof options.method === 'boolean' && options.method === true) {
    out.method = req.getMethod();
  }

  if (typeof options.path === 'boolean' && options.path === true) {
    out.path = req.getUrl().split('/', 2)[1];
  }

  if (typeof options.body === 'boolean' && options.body === true) {
    let opts = isObject(options.bodyOptions) ? options.bodyOptions : {};
    opts = merge(
      {
        headers: out.headers,
        highWaterMark: 1024,
        fileHwm: 1024,
        defCharset: 'utf8',
        preservePath: false,
        limits: {
          fieldNameSize: 255,
          fieldSize: 10 * 1024 * 1024,
          fields: 200,
          fileSize: 10 * 1024 * 1024,
          files: 10,
        },
      },
      opts,
    );

    if (typeof options.namespace !== 'string') {
      options.namespace = randomBytes(16).toString('hex');
    }

    try {
      const fetchBody = (): Promise<BodyType> => {
        return new Promise((resolve, reject) => {
          const busb = new Busboy(opts);
          const ret = {};

          const stream = new Readable();
          res.onData((ab, isLast) => {
            stream.push(Buffer.from(ab));
            if (isLast) {
              stream.push(null);
            }
          });

          stream.pipe(busb);
          finished(stream, (err) => {
            if (err) {
              stream.destroy();
              (busb as WriteStream).destroy();
              reject(Error('stream-error'));
            }
          });

          busb.on('limit', () => {
            reject(Error('limit'));
          });

          busb.on('file', function (fieldname, file, filename, encoding, mimetype) {
            const path = join(tmpdir(), options.namespace as string, filename);
            mkdirp(dirname(path));
            const writeStream = createWriteStream(path);
            file.pipe(writeStream);

            finished(writeStream, (err) => {
              if (!err) {
                set(ret, `files.${fieldname}`, {
                  file: path,
                  name: filename,
                  encoding,
                  mimetype,
                });
              } else {
                writeStream.destroy();
              }
            });
          });

          busb.on('field', function (fieldname, value) {
            set(ret, `fields.${fieldname}`, value);
          });

          busb.on('finish', function () {
            resolve(ret);
          });

          busb.on('error', () => {
            reject(Error('busboy-error'));
          });
        });
      };

      out.body = await fetchBody();
    } catch (e) {
      console.log(e);
    }
  }
  return out;
}

export { writeHeaders, stob, parseData };
