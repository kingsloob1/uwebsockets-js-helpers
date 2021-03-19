"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressions = void 0;
var fs_1 = require("fs");
var zlib_1 = require("zlib");
var functions_1 = require("./functions");
var mime_1 = require("./mime");
var functions_2 = require("./functions");
var bytes = 'bytes=';
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
function sendFileToRes(res, reqHeaders, path, _a) {
    var _b = _a.lastModified, lastModified = _b === void 0 ? true : _b, _c = _a.headers, headers = _c === void 0 ? {} : _c, _d = _a.compress, compress = _d === void 0 ? false : _d, _e = _a.compressionOptions, compressionOptions = _e === void 0 ? {
        priority: ['gzip', 'br', 'deflate'],
    } : _e, _f = _a.cache, cache = _f === void 0 ? false : _f;
    var statsData = fs_1.statSync(path);
    var mtime = statsData.mtime;
    var size = statsData.size;
    mtime.setMilliseconds(0);
    var mtimeutc = mtime.toUTCString();
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
    var start = 0, end = size - 1;
    if (reqHeaders.range) {
        compress = false;
        var parts = reqHeaders.range.replace(bytes, '').split('-');
        start = parseInt(parts[0], 10);
        end = parts[1] ? parseInt(parts[1], 10) : end;
        headers['accept-ranges'] = 'bytes';
        headers['content-range'] = "bytes " + start + "-" + end + "/" + size;
        size = end - start + 1;
        res.writeStatus('206 Partial Content');
    }
    // for size = 0
    if (end < 0)
        end = 0;
    var readStream = fs_1.createReadStream(path, { start: start, end: end });
    // Compression;
    var compressed = false;
    if (compress &&
        compressionOptions &&
        typeof compressionOptions === 'object' &&
        compressionOptions.priority &&
        typeof compressionOptions.priority === 'object') {
        var priority = compressionOptions.priority, options = __rest(compressionOptions, ["priority"]);
        var l = priority.length;
        for (var i = 0; i < l; i++) {
            var type = priority[i];
            if (reqHeaders['accept-encoding'].indexOf(type) > -1) {
                compressed = type;
                var compressor = exports.compressions[type](options);
                readStream.pipe(compressor);
                readStream = compressor;
                headers['content-encoding'] = priority[i];
                break;
            }
        }
    }
    res.onAborted(function () { return readStream.destroy(); });
    functions_1.writeHeaders(res, headers);
    // check cache
    if (cache) {
        return cache.wrap(path + "_" + mtimeutc + "_" + start + "_" + end + "_" + compressed, function (cb) {
            functions_2.stob(readStream)
                .then(function (b) { return cb(null, b); })
                .catch(cb);
        }, { ttl: 0 }, function (err, buffer) {
            if (err) {
                res.writeStatus('500 Internal server error');
                res.end();
                throw err;
            }
            res.end(buffer);
        });
    }
    else if (compressed) {
        readStream.on('data', function (buffer) {
            res.write(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
        });
    }
    else {
        readStream.on('data', function (buffer) {
            var chunk = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), lastOffset = res.getWriteOffset();
            // First try
            var _a = res.tryEnd(chunk, size), ok = _a[0], done = _a[1];
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
                res.onWritable(function (offset) {
                    var _a = res.tryEnd(res.ab.slice(offset - res.abOffset), size), ok = _a[0], done = _a[1];
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
        .on('error', function (e) {
        res.writeStatus('500 Internal server error');
        res.end();
        readStream.destroy();
        throw e;
    })
        .on('end', function () {
        res.end();
    });
}
exports.default = sendFile;
//# sourceMappingURL=sendFile.js.map