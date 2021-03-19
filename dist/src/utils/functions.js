"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseData = exports.stob = exports.writeHeaders = void 0;
var parse_headers_1 = __importDefault(require("parse-headers"));
var qs_1 = require("qs");
var fs_1 = require("fs");
var path_1 = require("path");
var busboy_1 = __importDefault(require("busboy"));
var mkdirp_1 = __importDefault(require("mkdirp"));
var lodash_1 = require("lodash");
var stream_1 = require("stream");
var os_1 = require("os");
var crypto_1 = require("crypto");
function writeHeaders(res, headers, other) {
    if (typeof headers === 'string' && typeof other === 'string') {
        res.writeHeader(headers, other.toString());
    }
    else if (typeof headers === 'object') {
        for (var n in headers) {
            res.writeHeader(n, headers[n].toString());
        }
    }
}
exports.writeHeaders = writeHeaders;
function stob(stream) {
    return new Promise(function (resolve) {
        var buffers = [];
        stream.on('data', buffers.push.bind(buffers));
        stream.on('end', function () {
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
function parseData(req, res, options) {
    return __awaiter(this, void 0, void 0, function () {
        var isAborted, out, headers_1, opts_1, fetchBody, _a, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    isAborted = false;
                    res.onAborted(function () {
                        isAborted = true;
                        console.log('Request aborted');
                    });
                    out = {};
                    if (isAborted)
                        return [2 /*return*/, out];
                    if ((typeof options.headers === 'boolean' && options.headers === true) || options.body === true) {
                        headers_1 = [];
                        req.forEach(function (key, value) {
                            headers_1.push(key + ": " + value);
                        });
                        out.headers = parse_headers_1.default(headers_1);
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
                    if (!(typeof options.body === 'boolean' && options.body === true)) return [3 /*break*/, 4];
                    opts_1 = lodash_1.isObject(options.bodyOptions) ? options.bodyOptions : {};
                    opts_1 = lodash_1.merge({
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
                    }, opts_1);
                    if (typeof options.namespace !== 'string') {
                        options.namespace = crypto_1.randomBytes(16).toString('hex');
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    fetchBody = function () {
                        return new Promise(function (resolve, reject) {
                            var busb = new busboy_1.default(opts_1);
                            var ret = {};
                            var stream = new stream_1.Readable();
                            res.onData(function (ab, isLast) {
                                stream.push(Buffer.from(ab));
                                if (isLast) {
                                    stream.push(null);
                                }
                            });
                            stream.pipe(busb);
                            stream_1.finished(stream, function (err) {
                                if (err) {
                                    stream.destroy();
                                    busb.destroy();
                                    reject(Error('stream-error'));
                                }
                            });
                            busb.on('limit', function () {
                                reject(Error('limit'));
                            });
                            busb.on('file', function (fieldname, file, filename, encoding, mimetype) {
                                var path = path_1.join(os_1.tmpdir(), options.namespace, filename);
                                mkdirp_1.default(path_1.dirname(path));
                                var writeStream = fs_1.createWriteStream(path);
                                file.pipe(writeStream);
                                stream_1.finished(writeStream, function (err) {
                                    if (!err) {
                                        lodash_1.set(ret, "files." + fieldname, {
                                            file: path,
                                            name: filename,
                                            encoding: encoding,
                                            mimetype: mimetype,
                                        });
                                    }
                                    else {
                                        writeStream.destroy();
                                    }
                                });
                            });
                            busb.on('field', function (fieldname, value) {
                                lodash_1.set(ret, "fields." + fieldname, value);
                            });
                            busb.on('finish', function () {
                                resolve(ret);
                            });
                            busb.on('error', function () {
                                reject(Error('busboy-error'));
                            });
                        });
                    };
                    _a = out;
                    return [4 /*yield*/, fetchBody()];
                case 2:
                    _a.body = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    console.log(e_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, out];
            }
        });
    });
}
exports.parseData = parseData;
//# sourceMappingURL=functions.js.map