"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGraphqlWsHandler = exports.generateGraphqlHandler = exports.getGraphqlParams = void 0;
const iterall_1 = require("iterall");
const Graphql = __importStar(require("graphql"));
const functions_1 = require("./functions");
async function getGraphqlParams(parsedData) {
    const { method, query: requestQuery, body } = parsedData;
    const lowerCaseMethod = method.toLowerCase();
    let query, variables, operationName;
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
    return {
        query,
        variableValues: variables,
        operationName,
    };
}
exports.getGraphqlParams = getGraphqlParams;
async function generateGraphqlHandler(res, req, settings) {
    res.onAborted(console.error);
    const { graphql: graphqlSettings, ...options } = settings;
    const parsedData = (await functions_1.parseData(req, res, {
        ...options,
        ...{
            method: true,
            body: true,
            query: true,
        },
    }));
    const { schema, options: graphqlOpts = null, graphql = Graphql, contextValue = {}, contextFxn = undefined, } = graphqlSettings;
    const { query, ...otherGraphqlParams } = await getGraphqlParams(parsedData);
    let graphqlOptions = {
        schema: typeof schema === 'function' ? await schema(parsedData) : schema,
        document: graphql.parse(query),
        ...otherGraphqlParams,
    };
    if (graphqlOpts) {
        graphqlOptions = {
            ...graphqlOpts,
            ...graphqlOptions,
        };
    }
    let ctx = {};
    if (typeof contextValue === 'object') {
        ctx = {
            ...ctx,
            ...contextValue,
        };
    }
    if (typeof contextFxn === 'function') {
        const val = await contextFxn(parsedData);
        if (typeof val === 'object') {
            ctx = {
                ...ctx,
                ...val,
            };
        }
    }
    graphqlOptions.contextValue = ctx;
    res.writeHeader('content-type', 'application/json');
    res.end(JSON.stringify(await graphql.execute(graphqlOptions)));
}
exports.generateGraphqlHandler = generateGraphqlHandler;
async function generateGraphqlWsHandler(settings) {
    const { options, uws = null } = settings;
    const { schema, options: graphqlOpts = null, graphql = Graphql, contextValue = {}, contextFxn = undefined } = options;
    let uwsOptions = {
        idleTimeout: 24 * 60 * 60,
    };
    if (uws) {
        uwsOptions = {
            ...uwsOptions,
            ...uws,
        };
    }
    const subscribe = graphql.subscribe;
    const execute = graphql.execute;
    let connectedUsersCount = 0;
    const behavior = {
        open: (ws) => {
            ws.opId = ++connectedUsersCount;
        },
        message: async (ws, message) => {
            const { type, payload, id: reqOpId } = JSON.parse(Buffer.from(message).toString('utf8'));
            const { query, ...graphqlMainOpts } = payload;
            let opId = connectedUsersCount;
            if (reqOpId) {
                opId = reqOpId;
            }
            let graphqlOptions = {
                schema: typeof schema === 'function'
                    ? await schema({
                        ws,
                    })
                    : schema,
                document: graphql.parse(query),
                ...graphqlOpts,
                ...graphqlMainOpts,
            };
            if (graphqlOpts) {
                graphqlOptions = {
                    ...graphqlOpts,
                    ...graphqlOptions,
                };
            }
            let ctx = {};
            if (typeof contextValue === 'object') {
                ctx = {
                    ...ctx,
                    ...contextValue,
                };
            }
            if (typeof contextFxn === 'function') {
                const val = await contextFxn({
                    ws,
                });
                if (typeof val === 'object') {
                    ctx = {
                        ...ctx,
                        ...val,
                    };
                }
            }
            graphqlOptions.contextValue = ctx;
            switch (type) {
                case 'start':
                    // eslint-disable-next-line no-case-declarations
                    let asyncIterable = await subscribe(graphqlOptions);
                    asyncIterable = (iterall_1.isAsyncIterable(asyncIterable)
                        ? asyncIterable
                        : iterall_1.createAsyncIterator([asyncIterable]));
                    iterall_1.forAwaitEach(asyncIterable, (result) => ws.send(JSON.stringify({
                        id: opId,
                        type: 'data',
                        payload: result,
                    })));
                    break;
                case 'stop':
                    ws.close();
                    connectedUsersCount--;
                    break;
                default:
                    ws.send(JSON.stringify({ payload: await execute(graphqlOptions), type: 'query', id: opId }));
                    break;
            }
        },
        ...uwsOptions,
    };
    return behavior;
}
exports.generateGraphqlWsHandler = generateGraphqlWsHandler;
//# sourceMappingURL=graphql.js.map