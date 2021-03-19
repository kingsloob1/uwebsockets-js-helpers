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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var Graphql = __importStar(require("graphql"));
var functions_1 = require("./functions");
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
                    query = body.query || query;
                    variables = body.variables || variables;
                    operationName = body.operationName || operationName;
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
function generateGraphqlHandler(res, req, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var graphqlSettings, options, parsedData, schema, _a, graphqlOpts, _b, graphql, _c, contextValue, _d, contextFxn, _e, query, otherGraphqlParams, graphqlOptions, _f, ctx, val, _g, _h, _j, _k;
        var _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    res.onAborted(console.error);
                    graphqlSettings = settings.graphql, options = __rest(settings, ["graphql"]);
                    return [4 /*yield*/, functions_1.parseData(req, res, __assign(__assign({}, options), {
                            method: true,
                            body: true,
                            query: true,
                        }))];
                case 1:
                    parsedData = (_m.sent());
                    schema = graphqlSettings.schema, _a = graphqlSettings.options, graphqlOpts = _a === void 0 ? null : _a, _b = graphqlSettings.graphql, graphql = _b === void 0 ? Graphql : _b, _c = graphqlSettings.contextValue, contextValue = _c === void 0 ? {} : _c, _d = graphqlSettings.contextFxn, contextFxn = _d === void 0 ? undefined : _d;
                    return [4 /*yield*/, getGraphqlParams(parsedData)];
                case 2:
                    _e = _m.sent(), query = _e.query, otherGraphqlParams = __rest(_e, ["query"]);
                    _l = {};
                    if (!(typeof schema === 'function')) return [3 /*break*/, 4];
                    return [4 /*yield*/, schema(parsedData)];
                case 3:
                    _f = _m.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _f = schema;
                    _m.label = 5;
                case 5:
                    graphqlOptions = __assign.apply(void 0, [(_l.schema = _f, _l.document = graphql.parse(query), _l), otherGraphqlParams]);
                    if (graphqlOpts) {
                        graphqlOptions = __assign(__assign({}, graphqlOpts), graphqlOptions);
                    }
                    ctx = {};
                    if (typeof contextValue === 'object') {
                        ctx = __assign(__assign({}, ctx), contextValue);
                    }
                    if (!(typeof contextFxn === 'function')) return [3 /*break*/, 7];
                    return [4 /*yield*/, contextFxn(parsedData)];
                case 6:
                    val = _m.sent();
                    if (typeof val === 'object') {
                        ctx = __assign(__assign({}, ctx), val);
                    }
                    _m.label = 7;
                case 7:
                    graphqlOptions.contextValue = ctx;
                    res.writeHeader('content-type', 'application/json');
                    _h = (_g = res).end;
                    _k = (_j = JSON).stringify;
                    return [4 /*yield*/, graphql.execute(graphqlOptions)];
                case 8:
                    _h.apply(_g, [_k.apply(_j, [_m.sent()])]);
                    return [2 /*return*/];
            }
        });
    });
}
exports.generateGraphqlHandler = generateGraphqlHandler;
function generateGraphqlWsHandler(settings) {
    return __awaiter(this, void 0, void 0, function () {
        var options, _a, uws, schema, _b, graphqlOpts, _c, graphql, _d, contextValue, _e, contextFxn, uwsOptions, subscribe, execute, connectedUsersCount, behavior;
        var _this = this;
        return __generator(this, function (_f) {
            options = settings.options, _a = settings.uws, uws = _a === void 0 ? null : _a;
            schema = options.schema, _b = options.options, graphqlOpts = _b === void 0 ? null : _b, _c = options.graphql, graphql = _c === void 0 ? Graphql : _c, _d = options.contextValue, contextValue = _d === void 0 ? {} : _d, _e = options.contextFxn, contextFxn = _e === void 0 ? undefined : _e;
            uwsOptions = {
                idleTimeout: 24 * 60 * 60,
            };
            if (uws) {
                uwsOptions = __assign(__assign({}, uwsOptions), uws);
            }
            subscribe = graphql.subscribe;
            execute = graphql.execute;
            connectedUsersCount = 0;
            behavior = __assign({ open: function (ws) {
                    ws.opId = ++connectedUsersCount;
                }, message: function (ws, message) { return __awaiter(_this, void 0, void 0, function () {
                    var _a, type, payload, reqOpId, query, graphqlMainOpts, opId, graphqlOptions, _b, ctx, val, _c, asyncIterable, _d, _e, _f, _g;
                    var _h, _j;
                    return __generator(this, function (_k) {
                        switch (_k.label) {
                            case 0:
                                _a = JSON.parse(Buffer.from(message).toString('utf8')), type = _a.type, payload = _a.payload, reqOpId = _a.id;
                                query = payload.query, graphqlMainOpts = __rest(payload, ["query"]);
                                opId = connectedUsersCount;
                                if (reqOpId) {
                                    opId = reqOpId;
                                }
                                _h = {};
                                if (!(typeof schema === 'function')) return [3 /*break*/, 2];
                                return [4 /*yield*/, schema({
                                        ws: ws,
                                    })];
                            case 1:
                                _b = _k.sent();
                                return [3 /*break*/, 3];
                            case 2:
                                _b = schema;
                                _k.label = 3;
                            case 3:
                                graphqlOptions = __assign.apply(void 0, [__assign.apply(void 0, [(_h.schema = _b, _h.document = graphql.parse(query), _h), graphqlOpts]), graphqlMainOpts]);
                                if (graphqlOpts) {
                                    graphqlOptions = __assign(__assign({}, graphqlOpts), graphqlOptions);
                                }
                                ctx = {};
                                if (typeof contextValue === 'object') {
                                    ctx = __assign(__assign({}, ctx), contextValue);
                                }
                                if (!(typeof contextFxn === 'function')) return [3 /*break*/, 5];
                                return [4 /*yield*/, contextFxn({
                                        ws: ws,
                                    })];
                            case 4:
                                val = _k.sent();
                                if (typeof val === 'object') {
                                    ctx = __assign(__assign({}, ctx), val);
                                }
                                _k.label = 5;
                            case 5:
                                graphqlOptions.contextValue = ctx;
                                _c = type;
                                switch (_c) {
                                    case 'start': return [3 /*break*/, 6];
                                    case 'stop': return [3 /*break*/, 8];
                                }
                                return [3 /*break*/, 9];
                            case 6: return [4 /*yield*/, subscribe(graphqlOptions)];
                            case 7:
                                asyncIterable = _k.sent();
                                asyncIterable = (iterall_1.isAsyncIterable(asyncIterable)
                                    ? asyncIterable
                                    : iterall_1.createAsyncIterator([asyncIterable]));
                                iterall_1.forAwaitEach(asyncIterable, function (result) {
                                    return ws.send(JSON.stringify({
                                        id: opId,
                                        type: 'data',
                                        payload: result,
                                    }));
                                });
                                return [3 /*break*/, 11];
                            case 8:
                                ws.close();
                                connectedUsersCount--;
                                return [3 /*break*/, 11];
                            case 9:
                                _e = (_d = ws).send;
                                _g = (_f = JSON).stringify;
                                _j = {};
                                return [4 /*yield*/, execute(graphqlOptions)];
                            case 10:
                                _e.apply(_d, [_g.apply(_f, [(_j.payload = _k.sent(), _j.type = 'query', _j.id = opId, _j)])]);
                                return [3 /*break*/, 11];
                            case 11: return [2 /*return*/];
                        }
                    });
                }); } }, uwsOptions);
            return [2 /*return*/, behavior];
        });
    });
}
exports.generateGraphqlWsHandler = generateGraphqlWsHandler;
//# sourceMappingURL=graphql.js.map