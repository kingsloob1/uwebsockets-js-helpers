"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseData = exports.stob = exports.writeHeaders = exports.ResDataToStream = void 0;
var qs_1 = require("qs");
var promises_1 = require("fs/promises");
var path_1 = require("path");
var busboy_1 = __importDefault(require("busboy"));
var mkdirp_1 = __importDefault(require("mkdirp"));
var lodash_1 = require("lodash");
var stream_1 = require("stream");
var os_1 = require("os");
function ResDataToStream(res) {
    var options = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        options[_i - 1] = arguments[_i];
    }
    var stream = new (stream_1.Readable.bind.apply(stream_1.Readable, __spreadArray([void 0], options, false)))();
    stream._read = function () {
        res.onData(function (chunk, isLast) {
            stream.push(Buffer.from(chunk));
            if (isLast)
                stream.push(null);
        });
    };
    return stream;
}
exports.ResDataToStream = ResDataToStream;
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
function stob(stream, maxSize) {
    if (maxSize === void 0) { maxSize = 0; }
    return new Promise(function (resolve, reject) {
        var hasEnded = false;
        var buffers = [];
        var length = 0;
        stream.on('data', function (buffer) {
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
        stream.on('end', function () {
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
exports.stob = stob;
function parseData(req, res, options) {
    return __awaiter(this, void 0, void 0, function () {
        var isAborted, out, headers_1, opts_1, stream_2, contentType, fetchBody, _a, data, e_1;
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
                        headers_1 = {};
                        req.forEach(function (k, value) {
                            var key = k.toLowerCase();
                            if (!(0, lodash_1.has)(headers_1, key)) {
                                (0, lodash_1.set)(headers_1, key, value);
                            }
                            else {
                                var val = (0, lodash_1.get)(headers_1, key);
                                if ((0, lodash_1.isArray)(val)) {
                                    val.push(value);
                                }
                                else {
                                    val = [val];
                                }
                                (0, lodash_1.set)(headers_1, key, val);
                            }
                        });
                        out.headers = headers_1;
                    }
                    if (typeof options.query === 'boolean' && options.query === true) {
                        out.query = (0, qs_1.parse)(req.getQuery(), {
                            parseArrays: false,
                        });
                    }
                    if (typeof options.method === 'boolean' && options.method === true) {
                        out.method = req.getMethod();
                    }
                    if (typeof options.path === 'boolean' && options.path === true) {
                        out.path = req.getUrl();
                    }
                    if (!(typeof options.body === 'boolean' && options.body === true)) return [3 /*break*/, 7];
                    opts_1 = (0, lodash_1.isObject)(options.bodyOptions) ? options.bodyOptions : {};
                    opts_1 = (0, lodash_1.merge)({
                        headers: __assign({ 'content-type': 'application/x-www-form-urlencoded' }, out.headers),
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
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, , 7]);
                    stream_2 = ResDataToStream(res);
                    contentType = (0, lodash_1.get)(out, 'headers.content-type', 'application/x-www-form-urlencoded').trim();
                    if (!('application/x-www-form-urlencoded' === contentType || contentType.startsWith('multipart/form-data;'))) return [3 /*break*/, 3];
                    fetchBody = function () {
                        return new Promise(function (resolve, reject) {
                            var busb = new busboy_1.default(opts_1);
                            var ret = {};
                            stream_2.pipe(busb);
                            (0, stream_1.finished)(stream_2, function (err) {
                                if (err) {
                                    stream_2.destroy();
                                    busb.end();
                                    reject(Error('stream-error'));
                                }
                            });
                            busb.on('limit', function () {
                                reject(Error('limit'));
                            });
                            busb.on('file', function (fieldname, file, filename, encoding, mimetype) {
                                var file_1, file_1_1;
                                var e_2, _a;
                                return __awaiter(this, void 0, void 0, function () {
                                    var tmpDir, folder, handle, fileData, hasWritten, path, exists, stats, _b, fd, chunk, e_2_1, _c;
                                    return __generator(this, function (_d) {
                                        switch (_d.label) {
                                            case 0:
                                                tmpDir = (0, os_1.tmpdir)();
                                                folder = '';
                                                handle = true;
                                                if (!options.customBodyOptions) return [3 /*break*/, 12];
                                                fileData = {
                                                    file: file,
                                                    filename: filename,
                                                    fieldname: fieldname,
                                                    encoding: encoding,
                                                    mimetype: mimetype,
                                                };
                                                if (!options.customBodyOptions.tmpDir) return [3 /*break*/, 3];
                                                if (!(typeof options.customBodyOptions.tmpDir === 'function')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, options.customBodyOptions.tmpDir(fileData)];
                                            case 1:
                                                tmpDir = _d.sent();
                                                return [3 /*break*/, 3];
                                            case 2:
                                                tmpDir = options.customBodyOptions.tmpDir;
                                                _d.label = 3;
                                            case 3:
                                                if (!options.customBodyOptions.folder) return [3 /*break*/, 6];
                                                if (!(typeof options.customBodyOptions.folder === 'function')) return [3 /*break*/, 5];
                                                return [4 /*yield*/, options.customBodyOptions.folder(fileData)];
                                            case 4:
                                                folder = _d.sent();
                                                return [3 /*break*/, 6];
                                            case 5:
                                                folder = options.customBodyOptions.folder;
                                                _d.label = 6;
                                            case 6:
                                                if (!options.customBodyOptions.handle) return [3 /*break*/, 9];
                                                if (!(typeof options.customBodyOptions.handle === 'function')) return [3 /*break*/, 8];
                                                return [4 /*yield*/, options.customBodyOptions.handle(fileData)];
                                            case 7:
                                                handle = _d.sent();
                                                return [3 /*break*/, 9];
                                            case 8:
                                                handle = options.customBodyOptions.handle;
                                                _d.label = 9;
                                            case 9:
                                                if (!options.customBodyOptions.saveAs) return [3 /*break*/, 12];
                                                if (!(typeof options.customBodyOptions.saveAs === 'function')) return [3 /*break*/, 11];
                                                return [4 /*yield*/, options.customBodyOptions.saveAs(fileData)];
                                            case 10:
                                                filename = _d.sent();
                                                return [3 /*break*/, 12];
                                            case 11:
                                                filename = options.customBodyOptions.saveAs;
                                                _d.label = 12;
                                            case 12:
                                                hasWritten = false;
                                                if (!handle) return [3 /*break*/, 35];
                                                if (options.namespace) {
                                                    if (folder)
                                                        folder = (0, path_1.join)(options.namespace, folder);
                                                    else
                                                        folder = options.namespace;
                                                }
                                                path = '';
                                                exists = false;
                                                _d.label = 13;
                                            case 13:
                                                _d.trys.push([13, 15, , 16]);
                                                path = (0, path_1.join)(tmpDir, folder, filename);
                                                return [4 /*yield*/, (0, promises_1.lstat)(path)];
                                            case 14:
                                                stats = _d.sent();
                                                exists = stats.isFile() || stats.isDirectory();
                                                return [3 /*break*/, 16];
                                            case 15:
                                                _b = _d.sent();
                                                return [3 /*break*/, 16];
                                            case 16:
                                                _d.trys.push([16, 34, , 35]);
                                                if (!!exists) return [3 /*break*/, 33];
                                                return [4 /*yield*/, (0, mkdirp_1.default)((0, path_1.dirname)(path))];
                                            case 17:
                                                _d.sent();
                                                return [4 /*yield*/, (0, promises_1.open)(path, 'w')];
                                            case 18:
                                                fd = _d.sent();
                                                _d.label = 19;
                                            case 19:
                                                _d.trys.push([19, 25, 26, 31]);
                                                file_1 = __asyncValues(file);
                                                _d.label = 20;
                                            case 20: return [4 /*yield*/, file_1.next()];
                                            case 21:
                                                if (!(file_1_1 = _d.sent(), !file_1_1.done)) return [3 /*break*/, 24];
                                                chunk = file_1_1.value;
                                                return [4 /*yield*/, (0, promises_1.write)(fd, Buffer.from(chunk))];
                                            case 22:
                                                _d.sent();
                                                _d.label = 23;
                                            case 23: return [3 /*break*/, 20];
                                            case 24: return [3 /*break*/, 31];
                                            case 25:
                                                e_2_1 = _d.sent();
                                                e_2 = { error: e_2_1 };
                                                return [3 /*break*/, 31];
                                            case 26:
                                                _d.trys.push([26, , 29, 30]);
                                                if (!(file_1_1 && !file_1_1.done && (_a = file_1.return))) return [3 /*break*/, 28];
                                                return [4 /*yield*/, _a.call(file_1)];
                                            case 27:
                                                _d.sent();
                                                _d.label = 28;
                                            case 28: return [3 /*break*/, 30];
                                            case 29:
                                                if (e_2) throw e_2.error;
                                                return [7 /*endfinally*/];
                                            case 30: return [7 /*endfinally*/];
                                            case 31: return [4 /*yield*/, fd.close()];
                                            case 32:
                                                _d.sent();
                                                hasWritten = true;
                                                (0, lodash_1.set)(ret, "files.".concat(fieldname), {
                                                    file: path,
                                                    mimetype: mimetype,
                                                });
                                                _d.label = 33;
                                            case 33: return [3 /*break*/, 35];
                                            case 34:
                                                _c = _d.sent();
                                                return [3 /*break*/, 35];
                                            case 35:
                                                if (!hasWritten) {
                                                    file.resume();
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                });
                            });
                            busb.on('field', function (fieldname, value) {
                                (0, lodash_1.set)(ret, "fields.".concat(fieldname), value);
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
                    _a = out;
                    return [4 /*yield*/, fetchBody()];
                case 2:
                    _a.body = _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    if (!(contentType === 'application/json')) return [3 /*break*/, 5];
                    return [4 /*yield*/, stob(stream_2, parseFloat((0, lodash_1.get)(opts_1, 'limits.fieldSize', 0)) || 0)];
                case 4:
                    data = _b.sent();
                    data = data.toString('utf8');
                    data = JSON.parse(data);
                    out.body = {
                        fields: data,
                    };
                    _b.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    e_1 = _b.sent();
                    console.log('error here', e_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, out];
            }
        });
    });
}
exports.parseData = parseData;
//# sourceMappingURL=functions.js.map