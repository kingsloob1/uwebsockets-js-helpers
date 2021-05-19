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
exports.generateGraphqlWsHandler = exports.generateGraphqlHandler = exports.getGraphqlParams = void 0;
var iterall_1 = require("iterall");
var functions_1 = require("./functions");
var lodash_1 = require("lodash");
function getGraphqlParams(parsedData) {
    return __awaiter(this, void 0, void 0, function () {
        var method, requestQuery, body, lowerCaseMethod, query, variables, operationName;
        return __generator(this, function (_a) {
            method = parsedData.method, requestQuery = parsedData.query, body = parsedData.body;
            lowerCaseMethod = method.toLowerCase();
            if (lowerCaseMethod === 'get' || lowerCaseMethod === 'post') {
                query = requestQuery.query;
                variables = requestQuery.variables;
                operationName = requestQuery.operationName;
                if (lowerCaseMethod === 'post') {
                    query = lodash_1.get(body, 'fields.query', query) || query;
                    variables = lodash_1.get(body, 'fields.variables', variables) || variables;
                    operationName = lodash_1.get(body, 'fields.operationName', operationName) || operationName;
                }
            }
            return [2 /*return*/, {
                    query: query,
                    variableValues: variables,
                    operationName: operationName,
                }];
        });
    });
}
exports.getGraphqlParams = getGraphqlParams;
var prepareExecutionResult = function (result, formatError) {
    if (formatError === void 0) { formatError = function (err) { return err; }; }
    return __awaiter(this, void 0, void 0, function () {
        var errors, other, out;
        return __generator(this, function (_a) {
            errors = result.errors, other = __rest(result, ["errors"]);
            out = other;
            if (errors) {
                out.errors = errors.map(function (error) {
                    var err = error.originalError ? error.originalError : error;
                    return formatError(err);
                });
            }
            return [2 /*return*/, out];
        });
    });
};
function generateGraphqlHandler(res, req, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var graphqlSettings, options, parsedData, schema, graphql, _a, graphqlOpts, _b, contextValue, _c, contextFxn, _d, handle, _e, rejected, formatError, process, _f, query, otherGraphqlParams, graphqlOptions, _g, ctx, val, result, _h;
        var _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    res.onAborted(console.error);
                    graphqlSettings = settings.graphql, options = __rest(settings, ["graphql"]);
                    return [4 /*yield*/, functions_1.parseData(req, res, __assign(__assign({}, options), {
                            method: true,
                            body: true,
                            query: true,
                        }))];
                case 1:
                    parsedData = (_k.sent());
                    schema = graphqlSettings.schema, graphql = graphqlSettings.graphql, _a = graphqlSettings.options, graphqlOpts = _a === void 0 ? null : _a, _b = graphqlSettings.contextValue, contextValue = _b === void 0 ? {} : _b, _c = graphqlSettings.contextFxn, contextFxn = _c === void 0 ? undefined : _c, _d = graphqlSettings.handle, handle = _d === void 0 ? true : _d, _e = graphqlSettings.rejected, rejected = _e === void 0 ? function () { return res.end(); } : _e, formatError = graphqlSettings.formatError;
                    process = handle;
                    if (!(typeof handle === 'function')) return [3 /*break*/, 3];
                    return [4 /*yield*/, handle(parsedData)];
                case 2:
                    process = _k.sent();
                    _k.label = 3;
                case 3:
                    if (!process) {
                        rejected('HANDLE');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getGraphqlParams(parsedData)];
                case 4:
                    _f = _k.sent(), query = _f.query, otherGraphqlParams = __rest(_f, ["query"]);
                    _j = {};
                    if (!(typeof schema === 'function')) return [3 /*break*/, 6];
                    return [4 /*yield*/, schema(parsedData)];
                case 5:
                    _g = _k.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _g = schema;
                    _k.label = 7;
                case 7:
                    graphqlOptions = __assign.apply(void 0, [(_j.schema = _g, _j.document = graphql.parse(query), _j), otherGraphqlParams]);
                    if (graphqlOpts) {
                        graphqlOptions = __assign(__assign({}, graphqlOpts), graphqlOptions);
                    }
                    ctx = {};
                    if (typeof contextValue === 'object' && lodash_1.isObject(ctx)) {
                        ctx = __assign(__assign({}, ctx), contextValue);
                    }
                    if (!(typeof contextFxn === 'function')) return [3 /*break*/, 9];
                    return [4 /*yield*/, contextFxn(parsedData)];
                case 8:
                    val = _k.sent();
                    if (typeof val === 'object' && lodash_1.isObject(val)) {
                        ctx = __assign(__assign({}, ctx), val);
                    }
                    _k.label = 9;
                case 9:
                    graphqlOptions.contextValue = ctx;
                    _h = prepareExecutionResult;
                    return [4 /*yield*/, graphql.execute(graphqlOptions)];
                case 10: return [4 /*yield*/, _h.apply(void 0, [_k.sent(), formatError])];
                case 11:
                    result = _k.sent();
                    res.writeHeader('content-type', 'application/json');
                    res.end(JSON.stringify(result));
                    return [2 /*return*/];
            }
        });
    });
}
exports.generateGraphqlHandler = generateGraphqlHandler;
function generateGraphqlWsHandler(settings) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, options, _b, uws, Options, uwsOptions, _c, upgradeHandler, _d, openHandler, _e, messageHandler, _f, closeHandler, uwsOpts, map, connectedUsersCount, behavior;
        var _this = this;
        return __generator(this, function (_g) {
            _a = settings.options, options = _a === void 0 ? null : _a, _b = settings.uws, uws = _b === void 0 ? null : _b;
            Options = {
                handle: true,
            };
            if (options) {
                Options = __assign(__assign({}, Options), options);
            }
            uwsOptions = {
                idleTimeout: 24 * 60 * 60,
            };
            if (uws) {
                uwsOptions = __assign(__assign({}, uwsOptions), uws);
            }
            _c = uwsOptions.upgrade, upgradeHandler = _c === void 0 ? function () { return true; } : _c, _d = uwsOptions.open, openHandler = _d === void 0 ? function () { return true; } : _d, _e = uwsOptions.message, messageHandler = _e === void 0 ? function () { return true; } : _e, _f = uwsOptions.close, closeHandler = _f === void 0 ? function () { return true; } : _f, uwsOpts = __rest(uwsOptions, ["upgrade", "open", "message", "close"]);
            map = new Map();
            connectedUsersCount = 0;
            behavior = __assign({ upgrade: function (res, req, context) { return __awaiter(_this, void 0, void 0, function () {
                    var check, parsedData, process, data, secWebsocketKey, secWebsocketProtocol, secWebsocketExtensions, ipAddress_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                check = { isAborted: false };
                                res.onAborted(function () {
                                    check.isAborted = true;
                                });
                                return [4 /*yield*/, functions_1.parseData(req, res, {
                                        method: true,
                                        body: true,
                                        query: true,
                                        path: true,
                                        headers: true,
                                    })];
                            case 1:
                                parsedData = (_a.sent());
                                if (check.isAborted)
                                    return [2 /*return*/];
                                process = true;
                                if (!(typeof Options.handle === 'function')) return [3 /*break*/, 3];
                                return [4 /*yield*/, Options.handle(parsedData)];
                            case 2:
                                process = _a.sent();
                                _a.label = 3;
                            case 3:
                                if (!process) {
                                    if (Options.rejected) {
                                        Options.rejected('HANDLE');
                                    }
                                    else
                                        res.end();
                                    return [2 /*return*/];
                                }
                                if (check.isAborted)
                                    return [2 /*return*/];
                                data = __assign(__assign({}, parsedData), { req: req,
                                    res: res,
                                    context: context });
                                return [4 /*yield*/, upgradeHandler(data)];
                            case 4:
                                process = _a.sent();
                                if (process && !check.isAborted) {
                                    secWebsocketKey = lodash_1.get(parsedData.headers, 'sec-websocket-key');
                                    if (lodash_1.isArray(secWebsocketKey))
                                        secWebsocketKey = secWebsocketKey.join(';');
                                    secWebsocketProtocol = lodash_1.get(parsedData.headers, 'sec-websocket-protocol');
                                    if (lodash_1.isArray(secWebsocketProtocol))
                                        secWebsocketProtocol = secWebsocketProtocol.join(';');
                                    secWebsocketExtensions = lodash_1.get(parsedData.headers, 'sec-websocket-extensions');
                                    if (lodash_1.isArray(secWebsocketExtensions))
                                        secWebsocketExtensions = secWebsocketExtensions.join(';');
                                    ipAddress_1 = Buffer.from(res.getRemoteAddressAsText()).toString('utf8');
                                    map.set(ipAddress_1, parsedData);
                                    res.upgrade({
                                        url: lodash_1.get(parsedData, 'path'),
                                    }, secWebsocketKey, secWebsocketProtocol, secWebsocketExtensions, context);
                                    setImmediate(function () { return map.delete(ipAddress_1); });
                                }
                                return [2 /*return*/];
                        }
                    });
                }); }, open: function (ws) {
                    ws.opId = ++connectedUsersCount;
                    var ipAddress = Buffer.from(ws.getRemoteAddressAsText()).toString('utf8');
                    var parsedData = map.has(ipAddress) ? map.get(ipAddress) : undefined;
                    map.delete(ipAddress);
                    ws.parsedData = parsedData;
                    openHandler(ws);
                }, message: function (ws, message, isBinary) { return __awaiter(_this, void 0, void 0, function () {
                    var proceed, options, _a, schema, _b, graphqlOpts, _c, graphql, _d, contextValue, _e, contextFxn, _f, handle, _g, rejected, formatError, subscribe, execute, data, type, payload, _h, reqOpId, opId, query, graphqlMainOpts, graphqlOptions, _j, ctx, val, asyncIterable, res, _k;
                    var _l;
                    return __generator(this, function (_m) {
                        switch (_m.label) {
                            case 0: return [4 /*yield*/, messageHandler(ws, message, isBinary)];
                            case 1:
                                proceed = _m.sent();
                                options = __assign({}, Options);
                                if (typeof proceed !== 'boolean') {
                                    options = __assign(__assign({}, options), proceed);
                                }
                                else {
                                    if (!proceed)
                                        return [2 /*return*/];
                                }
                                _a = options.schema, schema = _a === void 0 ? null : _a, _b = options.options, graphqlOpts = _b === void 0 ? null : _b, _c = options.graphql, graphql = _c === void 0 ? null : _c, _d = options.contextValue, contextValue = _d === void 0 ? {} : _d, _e = options.contextFxn, contextFxn = _e === void 0 ? undefined : _e, _f = options.handle, handle = _f === void 0 ? true : _f, _g = options.rejected, rejected = _g === void 0 ? function () { return null; } : _g, formatError = options.formatError;
                                if (schema === null)
                                    throw new Error('INVALID_EXECUTABLE_SCHEMA');
                                if (graphql === null)
                                    throw new Error('INVALID_GRAPHQL_IMPLEMENTATION');
                                if (!(typeof handle === 'function')) return [3 /*break*/, 3];
                                return [4 /*yield*/, handle({
                                        ws: ws,
                                    })];
                            case 2:
                                proceed = _m.sent();
                                return [3 /*break*/, 4];
                            case 3:
                                proceed = handle;
                                _m.label = 4;
                            case 4:
                                if (!proceed) {
                                    rejected('HANDLE');
                                    return [2 /*return*/];
                                }
                                subscribe = graphql.subscribe;
                                execute = graphql.execute;
                                data = JSON.parse(Buffer.from(message).toString('utf8'));
                                if (!(data && lodash_1.has(data, 'type') && lodash_1.isString(data.type) && lodash_1.has(data, 'payload')))
                                    return [2 /*return*/];
                                type = data.type, payload = data.payload, _h = data.id, reqOpId = _h === void 0 ? null : _h;
                                opId = connectedUsersCount;
                                if (reqOpId) {
                                    opId = reqOpId;
                                }
                                if (!(type === 'stop' || type === 'connection_terminate')) return [3 /*break*/, 5];
                                ws.close();
                                if (connectedUsersCount > 0)
                                    connectedUsersCount--;
                                return [3 /*break*/, 14];
                            case 5:
                                if (!(lodash_1.isObject(payload) && lodash_1.isString(payload.query)))
                                    return [2 /*return*/];
                                query = payload.query, graphqlMainOpts = __rest(payload, ["query"]);
                                _l = {};
                                if (!(typeof schema === 'function')) return [3 /*break*/, 7];
                                return [4 /*yield*/, schema({
                                        ws: ws,
                                    })];
                            case 6:
                                _j = _m.sent();
                                return [3 /*break*/, 8];
                            case 7:
                                _j = schema;
                                _m.label = 8;
                            case 8:
                                graphqlOptions = __assign.apply(void 0, [__assign.apply(void 0, [(_l.schema = _j, _l.document = graphql.parse(query), _l), graphqlOpts]), graphqlMainOpts]);
                                if (graphqlOpts) {
                                    graphqlOptions = __assign(__assign({}, graphqlOpts), graphqlOptions);
                                }
                                ctx = {};
                                if (typeof contextValue === 'object') {
                                    ctx = __assign(__assign({}, ctx), contextValue);
                                }
                                if (!(typeof contextFxn === 'function')) return [3 /*break*/, 10];
                                return [4 /*yield*/, contextFxn({
                                        ws: ws,
                                    })];
                            case 9:
                                val = _m.sent();
                                if (typeof val === 'object') {
                                    ctx = __assign(__assign({}, ctx), val);
                                }
                                _m.label = 10;
                            case 10:
                                graphqlOptions.contextValue = ctx;
                                if (!(type === 'start' || type === 'connection_init')) return [3 /*break*/, 12];
                                return [4 /*yield*/, subscribe(graphqlOptions)];
                            case 11:
                                asyncIterable = _m.sent();
                                asyncIterable = (iterall_1.isAsyncIterable(asyncIterable) ? asyncIterable : iterall_1.createAsyncIterator([asyncIterable]));
                                iterall_1.forAwaitEach(asyncIterable, function (result) {
                                    var res = prepareExecutionResult(result, formatError);
                                    ws.send(JSON.stringify({
                                        id: opId,
                                        type: 'data',
                                        payload: res,
                                    }));
                                });
                                return [3 /*break*/, 14];
                            case 12:
                                _k = prepareExecutionResult;
                                return [4 /*yield*/, execute(graphqlOptions)];
                            case 13:
                                res = _k.apply(void 0, [_m.sent(), formatError]);
                                ws.send(JSON.stringify({ payload: res, type: 'query', id: opId }));
                                _m.label = 14;
                            case 14: return [2 /*return*/];
                        }
                    });
                }); }, close: function (ws, code, ab) {
                    return __awaiter(this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, closeHandler(ws, code, ab)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    });
                } }, uwsOpts);
            return [2 /*return*/, behavior];
        });
    });
}
exports.generateGraphqlWsHandler = generateGraphqlWsHandler;
//# sourceMappingURL=graphql.js.map