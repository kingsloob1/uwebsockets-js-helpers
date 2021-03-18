"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressions = void 0;
const fs_1 = require("fs");
const zlib_1 = require("zlib");
const functions_1 = require("./functions");
const mime_1 = require("./mime");
const functions_2 = require("./functions");
const bytes = 'bytes=';
exports.compressions = {
    br: zlib_1.createBrotliCompress,
    gzip: zlib_1.createGzip,
    deflate: zlib_1.createDeflate,
};
function sendFile(res, req, path, options) {
    sendFileToRes(res, {
        'if-modified-since': req.getHeader('if-modified-since'),
        range: req.getHeader('range'),
        'accept-encoding': req.getHeader('accept-encoding'),
    }, path, options);
}
function sendFileToRes(res, reqHeaders, path, { lastModified = true, headers = {}, compress = false, compressionOptions = {
    priority: ['gzip', 'br', 'deflate'],
}, cache = false, }) {
    const statsData = fs_1.statSync(path);
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
    headers['content-type'] = mime_1.getMime(path);
    // write data
    let start = 0, end = size - 1;
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
    if (end < 0)
        end = 0;
    let readStream = fs_1.createReadStream(path, { start, end });
    // Compression;
    let compressed = false;
    if (compress &&
        compressionOptions &&
        typeof compressionOptions === 'object' &&
        compressionOptions.priority &&
        typeof compressionOptions.priority === 'object') {
        const { priority, ...options } = compressionOptions;
        const l = priority.length;
        for (let i = 0; i < l; i++) {
            const type = priority[i];
            if (reqHeaders['accept-encoding'].indexOf(type) > -1) {
                compressed = type;
                const compressor = exports.compressions[type](options);
                readStream.pipe(compressor);
                readStream = compressor;
                headers['content-encoding'] = priority[i];
                break;
            }
        }
    }
    res.onAborted(() => readStream.destroy());
    functions_1.writeHeaders(res, headers);
    // check cache
    if (cache) {
        return cache.wrap(`${path}_${mtimeutc}_${start}_${end}_${compressed}`, (cb) => {
            functions_2.stob(readStream)
                .then((b) => cb(null, b))
                .catch(cb);
        }, { ttl: 0 }, (err, buffer) => {
            if (err) {
                res.writeStatus('500 Internal server error');
                res.end();
                throw err;
            }
            res.end(buffer);
        });
    }
    else if (compressed) {
        readStream.on('data', (buffer) => {
            res.write(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        });
    }
    else {
        readStream.on('data', (buffer) => {
            const chunk = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), lastOffset = res.getWriteOffset();
            // First try
            const [ok, done] = res.tryEnd(chunk, size);
            if (done) {
                readStream.destroy();
            }
            else if (!ok) {
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
                    }
                    else if (ok) {
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
exports.default = sendFile;
//# sourceMappingURL=sendFile.js.map