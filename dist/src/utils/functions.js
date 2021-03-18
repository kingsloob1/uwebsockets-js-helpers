"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseData = exports.stob = exports.writeHeaders = void 0;
const parse_headers_1 = __importDefault(require("parse-headers"));
const qs_1 = require("qs");
const fs_1 = require("fs");
const path_1 = require("path");
const busboy_1 = __importDefault(require("busboy"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const lodash_1 = require("lodash");
const stream_1 = require("stream");
const os_1 = require("os");
const node_crypto_1 = require("node:crypto");
function writeHeaders(res, headers, other) {
    if (typeof headers === 'string' && typeof other === 'string') {
        res.writeHeader(headers, other.toString());
    }
    else if (typeof headers === 'object') {
        for (const n in headers) {
            res.writeHeader(n, headers[n].toString());
        }
    }
}
exports.writeHeaders = writeHeaders;
function stob(stream) {
    return new Promise((resolve) => {
        const buffers = [];
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
exports.stob = stob;
async function parseData(req, res, options) {
    let isAborted = false;
    res.onAborted(() => {
        isAborted = true;
        console.log('Request aborted');
    });
    const out = {};
    if (isAborted)
        return out;
    if ((typeof options.headers === 'boolean' && options.headers === true) || options.body === true) {
        const headers = [];
        req.forEach((key, value) => {
            headers.push(`${key}: ${value}`);
        });
        out.headers = parse_headers_1.default(headers);
    }
    if (typeof options.query === 'boolean' && options.query === true) {
        out.query = qs_1.parse(req.getQuery());
    }
    if (typeof options.method === 'boolean' && options.method === true) {
        out.method = req.getMethod();
    }
    if (typeof options.path === 'boolean' && options.path === true) {
        out.path = req.getUrl().split('/', 2)[1];
    }
    if (typeof options.body === 'boolean' && options.body === true) {
        let opts = lodash_1.isObject(options.bodyOptions) ? options.bodyOptions : {};
        opts = lodash_1.merge({
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
        }, opts);
        if (typeof options.namespace !== 'string') {
            options.namespace = node_crypto_1.randomBytes(16).toString('hex');
        }
        try {
            const fetchBody = () => {
                return new Promise((resolve, reject) => {
                    const busb = new busboy_1.default(opts);
                    const ret = {};
                    const stream = new stream_1.Readable();
                    res.onData((ab, isLast) => {
                        stream.push(Buffer.from(ab));
                        if (isLast) {
                            stream.push(null);
                        }
                    });
                    stream.pipe(busb);
                    stream_1.finished(stream, (err) => {
                        if (err) {
                            stream.destroy();
                            busb.destroy();
                            reject(Error('stream-error'));
                        }
                    });
                    busb.on('limit', () => {
                        reject(Error('limit'));
                    });
                    busb.on('file', function (fieldname, file, filename, encoding, mimetype) {
                        const path = path_1.join(os_1.tmpdir(), options.namespace, filename);
                        mkdirp_1.default(path_1.dirname(path));
                        const writeStream = fs_1.createWriteStream(path);
                        file.pipe(writeStream);
                        stream_1.finished(writeStream, (err) => {
                            if (!err) {
                                lodash_1.set(ret, `files.${fieldname}`, {
                                    file: path,
                                    name: filename,
                                    encoding,
                                    mimetype,
                                });
                            }
                            else {
                                writeStream.destroy();
                            }
                        });
                    });
                    busb.on('field', function (fieldname, value) {
                        lodash_1.set(ret, `fields.${fieldname}`, value);
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
        }
        catch (e) {
            console.log(e);
        }
    }
    return out;
}
exports.parseData = parseData;
//# sourceMappingURL=functions.js.map