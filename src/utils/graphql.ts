import { createAsyncIterator, forAwaitEach, isAsyncIterable } from 'iterall';
import { HttpResponse, HttpRequest, WebSocketBehavior, WebSocket, us_socket_context_t } from 'uWebSockets.js';
import { GraphQLSchema, ExecutionArgs, SubscriptionArgs, ExecutionResult } from 'graphql';
import * as Graphql from 'graphql';
import { ParsedData, parseData, ParseDataOptions } from './functions';
import { get, isArray, isObject, isString, has } from 'lodash';

export type GraphqlOptions<T> = {
  [P in keyof T]: T[P];
};

export type GraphqlParams = {
  query: string;
  variableValues: {
    [key: string]: unknown;
  };
  operationName: string;
};

export type GraphqlCallbackData = {
  ws: WebSocket;
};

export type GraphqlFxOptions<T> = {
  schema: GraphQLSchema | ((parsedData: ParsedData | GraphqlCallbackData) => GraphQLSchema | Promise<GraphQLSchema>);
  graphql: typeof Graphql;
  options?: GraphqlOptions<T>;
  contextValue?: unknown;
  contextFxn?: (parsedData: ParsedData | GraphqlCallbackData) => unknown | Promise<unknown>;
  handle?: ((parsedData: ParsedData | GraphqlCallbackData) => boolean | Promise<boolean>) | boolean;
  rejected?: (reason: string) => Promise<void> | void;
  formatError?: (err: unknown) => Promise<unknown> | unknown;
};

export type GraphqlParsedData = ParsedData & Required<Pick<ParsedData, 'method' | 'query' | 'body'>>;

export async function getGraphqlParams(parsedData: GraphqlParsedData): Promise<GraphqlParams> {
  const { method, query: requestQuery, body } = parsedData;
  const lowerCaseMethod = method.toLowerCase();
  let query: unknown, variables: unknown, operationName: unknown;

  if (lowerCaseMethod === 'get' || lowerCaseMethod === 'post') {
    query = requestQuery.query;
    variables = requestQuery.variables;
    operationName = requestQuery.operationName;

    if (lowerCaseMethod === 'post') {
      query = get(body, 'fields.query', query) || query;
      variables = get(body, 'fields.variables', variables) || variables;
      operationName = get(body, 'fields.operationName', operationName) || operationName;
    }
  }

  return {
    query,
    variableValues: variables,
    operationName,
  } as GraphqlParams;
}

const prepareExecutionResult = async function (
  result: ExecutionResult,
  formatError: (err: unknown) => unknown = (err) => err,
) {
  const { errors, ...other } = result;
  const out: Omit<ExecutionResult, 'errors'> & {
    errors?: unknown[];
  } = other;

  if (errors) {
    out.errors = errors.map((error) => {
      const err = error.originalError ? error.originalError : error;
      return formatError(err);
    });
  }

  return out;
};

export async function generateGraphqlHandler(
  res: HttpResponse,
  req: HttpRequest,
  settings: ParseDataOptions & {
    graphql: GraphqlFxOptions<ExecutionArgs>;
  },
): Promise<void> {
  res.onAborted(console.error);
  const { graphql: graphqlSettings, ...options } = settings;
  const parsedData = (await parseData(req, res, {
    ...options,
    ...{
      method: true,
      body: true,
      query: true,
    },
  })) as GraphqlParsedData;

  const {
    schema,
    graphql,
    options: graphqlOpts = null,
    contextValue = {},
    contextFxn = undefined,
    handle = true,
    rejected = () => res.end(),
    formatError,
  } = graphqlSettings;

  let process = handle;
  if (typeof handle === 'function') {
    process = await handle(parsedData);
  }

  if (!process) {
    rejected('HANDLE');
    return;
  }

  const { query, ...otherGraphqlParams } = await getGraphqlParams(parsedData);
  let graphqlOptions: GraphqlOptions<ExecutionArgs> = {
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
  if (typeof contextValue === 'object' && isObject(ctx)) {
    ctx = {
      ...ctx,
      ...contextValue,
    };
  }

  if (typeof contextFxn === 'function') {
    const val = await contextFxn(parsedData);
    if (typeof val === 'object' && isObject(val)) {
      ctx = {
        ...ctx,
        ...val,
      };
    }
  }

  graphqlOptions.contextValue = ctx;

  const result = await prepareExecutionResult(await graphql.execute(graphqlOptions), formatError);
  res.writeHeader('content-type', 'application/json');
  res.end(JSON.stringify(result));
}

export type GraphqlWsMessage = {
  type: 'start' | 'stop' | 'query' | 'connection_init' | 'connection_terminate';
  payload?: GraphqlParams | null;
  id?: number;
};

export type GraphqlWsUpgradeHandlerData = GraphqlParsedData & {
  req: HttpRequest;
  res: HttpResponse;
  context: us_socket_context_t;
};
export interface GraphqlWebSocketBehavior extends Omit<WebSocketBehavior, 'upgrade'> {
  upgrade?: (data: GraphqlWsUpgradeHandlerData) => boolean | Promise<boolean>;
  open?: (ws: WebSocket) => boolean | Promise<boolean>;
  message?: (
    ws: WebSocket,
    message: ArrayBuffer,
    isBinary: boolean,
  ) =>
    | boolean
    | Promise<boolean>
    | Partial<GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>>
    | Promise<Partial<GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>>>;
  close?: (ws: WebSocket, code: number, message: ArrayBuffer) => boolean | Promise<boolean>;
}

export async function generateGraphqlWsHandler(settings: {
  options?: Partial<GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>>;
  uws?: {
    [P in keyof GraphqlWebSocketBehavior]: GraphqlWebSocketBehavior[P];
  };
}): Promise<WebSocketBehavior> {
  const { options = null, uws = null } = settings;

  let Options: Partial<GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>> = {
    handle: true,
  };

  if (options) {
    Options = {
      ...Options,
      ...options,
    };
  }

  let uwsOptions: GraphqlWebSocketBehavior = {
    idleTimeout: 24 * 60 * 60,
  };

  if (uws) {
    uwsOptions = {
      ...uwsOptions,
      ...uws,
    };
  }

  const {
    upgrade: upgradeHandler = () => true,
    open: openHandler = () => true,
    message: messageHandler = () => true,
    close: closeHandler = () => true,
    ...uwsOpts
  } = uwsOptions;

  const map = new Map<string, GraphqlParsedData>();
  let connectedUsersCount = 0;
  const behavior: WebSocketBehavior = {
    upgrade: async (res, req, context) => {
      const check = { isAborted: false };
      res.onAborted(function () {
        check.isAborted = true;
      });

      const parsedData = (await parseData(req, res, {
        method: true,
        body: true,
        query: true,
        path: true,
        headers: true,
      })) as GraphqlParsedData;

      if (check.isAborted) return;
      let process = true;
      if (typeof Options.handle === 'function') {
        process = await Options.handle(parsedData);
      }

      if (!process) {
        if (Options.rejected) {
          Options.rejected('HANDLE');
        } else res.end();
        return;
      }

      if (check.isAborted) return;
      const data: GraphqlWsUpgradeHandlerData = {
        ...parsedData,
        req,
        res,
        context,
      };

      process = await upgradeHandler(data);
      if (process && !check.isAborted) {
        let secWebsocketKey = get(parsedData.headers, 'sec-websocket-key');
        if (isArray(secWebsocketKey)) secWebsocketKey = secWebsocketKey.join(';');

        let secWebsocketProtocol = get(parsedData.headers, 'sec-websocket-protocol');
        if (isArray(secWebsocketProtocol)) secWebsocketProtocol = secWebsocketProtocol.join(';');

        let secWebsocketExtensions = get(parsedData.headers, 'sec-websocket-extensions');
        if (isArray(secWebsocketExtensions)) secWebsocketExtensions = secWebsocketExtensions.join(';');

        const ipAddress = Buffer.from(res.getRemoteAddressAsText()).toString('utf8');
        map.set(ipAddress, parsedData);
        res.upgrade(
          {
            url: get(parsedData, 'path'),
          },
          secWebsocketKey as string,
          secWebsocketProtocol as string,
          secWebsocketExtensions as string,
          context,
        );

        setImmediate(() => map.delete(ipAddress));
      }
    },
    open: (ws) => {
      ws.opId = ++connectedUsersCount;
      const ipAddress = Buffer.from(ws.getRemoteAddressAsText()).toString('utf8');
      const parsedData = map.has(ipAddress) ? map.get(ipAddress) : undefined;
      map.delete(ipAddress);
      ws.parsedData = parsedData;
      openHandler(ws);
    },
    message: async (ws, message, isBinary) => {
      let proceed = await messageHandler(ws, message, isBinary);
      let options: Partial<GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>> = {
        ...Options,
      };

      if (typeof proceed !== 'boolean') {
        options = {
          ...options,
          ...proceed,
        };
      } else {
        if (!proceed) return;
      }

      const {
        schema = null,
        options: graphqlOpts = null,
        graphql = null,
        contextValue = {},
        contextFxn = undefined,
        handle = true,
        rejected = () => null,
        formatError,
      } = options;

      if (schema === null) throw new Error('INVALID_EXECUTABLE_SCHEMA');
      if (graphql === null) throw new Error('INVALID_GRAPHQL_IMPLEMENTATION');
      if (typeof handle === 'function') {
        proceed = await handle({
          ws,
        });
      } else {
        proceed = handle;
      }

      if (!proceed) {
        rejected('HANDLE');
        return;
      }

      const subscribe = graphql.subscribe;
      const execute = graphql.execute;

      const data: GraphqlWsMessage = JSON.parse(Buffer.from(message).toString('utf8'));
      if (!(data && has(data, 'type') && isString(data.type) && has(data, 'payload'))) return;

      const { type, payload, id: reqOpId = null } = data;

      let opId: number = connectedUsersCount;
      if (reqOpId) {
        opId = reqOpId;
      }

      if (type === 'stop' || type === 'connection_terminate') {
        ws.close();
        if (connectedUsersCount > 0) connectedUsersCount--;
      } else {
        if (!(isObject(payload) && isString(payload.query))) return;
        const { query, ...graphqlMainOpts } = payload;

        let graphqlOptions: GraphqlOptions<SubscriptionArgs> = {
          schema:
            typeof schema === 'function'
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

        if (type === 'start' || type === 'connection_init') {
          let asyncIterable = await subscribe(graphqlOptions);
          asyncIterable = (
            isAsyncIterable(asyncIterable) ? asyncIterable : createAsyncIterator([asyncIterable])
          ) as AsyncIterableIterator<ExecutionResult>;

          forAwaitEach(asyncIterable, (result) => {
            const res = prepareExecutionResult(result, formatError);
            ws.send(
              JSON.stringify({
                id: opId,
                type: 'data',
                payload: res,
              }),
            );
          });
        } else {
          const res = prepareExecutionResult(await execute(graphqlOptions), formatError);
          ws.send(JSON.stringify({ payload: res, type: 'query', id: opId }));
        }
      }
    },
    async close(ws, code, ab) {
      await closeHandler(ws, code, ab);
    },
    ...uwsOpts,
  };

  return behavior;
}
