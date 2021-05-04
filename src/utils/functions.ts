import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { parse as parseQuery } from 'qs';
import { lstatSync, openSync, writeSync, closeSync } from 'fs';
import { join, dirname } from 'path';
import Busboy from 'busboy';
import mkdirp from 'mkdirp';
import { isObject, merge, set, has, get, isArray } from 'lodash';
import { finished as finishedCallback, Readable } from 'stream';
import { tmpdir } from 'os';

export function ResDataToStream(
  res: HttpResponse,
  ...options: ConstructorParameters<typeof Readable>
): InstanceType<typeof Readable> {
  const stream = new Readable(...options);
  stream._read = function () {
    res.onData(function (chunk, isLast) {
      stream.push(Buffer.from(chunk));
      if (isLast) stream.push(null);
    });
  };

  return stream;
}

export function writeHeaders(res: HttpResponse, headers: { [name: string]: string } | string, other?: string): void {
  if (typeof headers === 'string' && typeof other === 'string') {
    res.writeHeader(headers, other.toString());
  } else if (typeof headers === 'object') {
    for (const n in headers) {
      res.writeHeader(n, headers[n].toString());
    }
  }
}

export function stob(stream: Readable, maxSize = 0): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let hasEnded = false;
    let buffers: Buffer[] | null = [];
    let length = 0;

    stream.on('data', function (buffer: Buffer) {
      if (buffers && !hasEnded) {
        buffer = Buffer.from(buffer);
        buffers.push(buffer);

        if (maxSize) {
          length += Buffer.byteLength(buffer);

          if (length > maxSize) {
            buffers = null;
            hasEnded = true;
            stream.destroy();
            reject('MAX_SIZE_EXCEEDED');
          }
        }
      }
    });

    stream.on('end', () => {
      hasEnded = true;

      if (buffers) {
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
      }
    });

    stream.resume();
  });
}

export type FileInfo = {
  fieldname: string;
  filename: string;
  encoding: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
};

export type ParseDataOptions = {
  namespace?: string;
  headers?: boolean;
  body?: boolean;
  query?: boolean;
  path?: boolean;
  method?: boolean;
  bodyOptions?: busboy.BusboyConfig;
  customBodyOptions?: {
    fileNameGenerator?: (options: FileInfo) => string | Promise<string>;
    handle?: (options?: FileInfo) => boolean | Promise<boolean>;
    save?: (options?: FileInfo) => boolean | Promise<boolean>;
    tmpDir?: (options?: FileInfo) => string | Promise<string>;
    folder?: (options?: FileInfo) => string | Promise<string>;
  };
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

export async function parseData(req: HttpRequest, res: HttpResponse, options: ParseDataOptions): Promise<ParsedData> {
  let isAborted = false;
  res.onAborted(() => {
    isAborted = true;
    console.log('Request aborted');
  });

  const out: ParsedData = {};
  if (isAborted) return out;

  if ((typeof options.headers === 'boolean' && options.headers === true) || options.body === true) {
    const headers = {};
    req.forEach((k, value) => {
      const key = k.toLowerCase();
      if (!has(headers, key)) {
        set(headers, key, value);
      } else {
        let val = get(headers, key);
        if (isArray(val)) {
          val.push(value);
        } else {
          val = [val];
        }

        set(headers, key, val);
      }
    });

    out.headers = headers;
  }

  if (typeof options.query === 'boolean' && options.query === true) {
    out.query = parseQuery(req.getQuery(), {
      parseArrays: false,
    });
  }

  if (typeof options.method === 'boolean' && options.method === true) {
    out.method = req.getMethod();
  }

  if (typeof options.path === 'boolean' && options.path === true) {
    out.path = req.getUrl();
  }

  if (typeof options.body === 'boolean' && options.body === true) {
    let opts = isObject(options.bodyOptions) ? options.bodyOptions : {};
    opts = merge(
      {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          ...out.headers,
        },
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

    try {
      const stream = ResDataToStream(res);
      const contentType = (get(out, 'headers.content-type', 'application/x-www-form-urlencoded') as string).trim();

      if ('application/x-www-form-urlencoded' === contentType || contentType.startsWith('multipart/form-data;')) {
        const fetchBody = (): Promise<BodyType> => {
          return new Promise((resolve, reject) => {
            const busb = new Busboy(opts);
            const ret = {};

            stream.pipe(busb);
            finishedCallback(stream, (err) => {
              if (err) {
                stream.destroy();
                busb.end();
                reject(Error('stream-error'));
              }
            });

            busb.on('limit', () => {
              reject(Error('limit'));
            });

            busb.on('file', async function (fieldname, file, filename, encoding, mimetype) {
              let tmpDir = tmpdir();
              let folder = '';
              let save = true;

              if (options.customBodyOptions) {
                const fileData: FileInfo = {
                  file,
                  filename,
                  fieldname,
                  encoding,
                  mimetype,
                };

                if (options.customBodyOptions.tmpDir) tmpDir = await options.customBodyOptions.tmpDir(fileData);
                if (options.customBodyOptions.folder) folder = await options.customBodyOptions.folder(fileData);
                if (options.customBodyOptions.save) save = await options.customBodyOptions.save(fileData);
                if (options.customBodyOptions.fileNameGenerator)
                  fieldname = await options.customBodyOptions.fileNameGenerator(fileData);
              }

              let hasWritten = false;
              if (save) {
                if (options.namespace) {
                  if (folder) folder = `${options.namespace}/${folder}`;
                  else folder = options.namespace;
                }

                let path = '';
                let exists = false;
                try {
                  path = join(tmpDir, folder, filename);
                  const stats = lstatSync(path);
                  exists = stats.isFile() || stats.isDirectory();
                } catch {}

                try {
                  if (!exists) {
                    mkdirp.sync(dirname(path));
                    const fd = openSync(path, 'w');

                    for await (const chunk of file) {
                      writeSync(fd, Buffer.from(chunk));
                    }

                    closeSync(fd);
                    hasWritten = true;
                    set(ret, `files.${fieldname}`, {
                      file: path,
                      mimetype,
                    });
                  }
                } catch {}
              }

              if (!hasWritten) {
                file.resume();
              }
            });

            busb.on('field', function (fieldname, value) {
              set(ret, `fields.${fieldname}`, value);
            });

            busb.on('finish', function () {
              resolve(ret);
            });

            busb.on('partsLimit', function () {
              reject(Error('busboy-partslimit-error'));
            });

            busb.on('fieldsLimit', function () {
              reject(Error('busboy-fieldslimit-error'));
            });

            busb.on('filesLimit', function () {
              reject(Error('busboy-fileslimit-error'));
            });

            busb.on('error', function () {
              reject(Error('busboy-error'));
            });
          });
        };

        out.body = await fetchBody();
      } else if (contentType === 'application/json') {
        let data: Buffer | string = await stob(stream, parseFloat(get(opts, 'limits.fieldSize', 0)) || 0);
        data = data.toString('utf8');
        data = JSON.parse(data);
        out.body = {
          fields: data,
        };
      }
    } catch (e) {
      console.log('error here', e);
    }
  }
  return out;
}
