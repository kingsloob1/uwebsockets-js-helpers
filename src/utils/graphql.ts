import { createAsyncIterator, forAwaitEach, isAsyncIterable } from 'iterall';
import { HttpResponse, HttpRequest, WebSocketBehavior, WebSocket } from 'uWebSockets.js';
import { GraphQLSchema, ExecutionArgs, SubscriptionArgs, ExecutionResult } from 'graphql';
import * as Graphql from 'graphql';
import { ParsedData, parseData, ParseDataOptions } from './functions';

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
  options?: GraphqlOptions<T>;
  graphql?: typeof Graphql;
  contextValue?: unknown;
  contextFxn?: (parsedData: ParsedData | GraphqlCallbackData) => unknown | Promise<unknown>;
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
      query = body.query || query;
      variables = body.variables || variables;
      operationName = body.operationName || operationName;
    }
  }

  return {
    query,
    variableValues: variables,
    operationName,
  } as GraphqlParams;
}

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
    options: graphqlOpts = null,
    graphql = Graphql,
    contextValue = {},
    contextFxn = undefined,
  } = graphqlSettings;

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

export type GraphqlWsMessage = {
  type: 'start' | 'stop' | 'query';
  payload: GraphqlParams;
  id: number;
};

export async function generateGraphqlWsHandler(settings: {
  options: GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>;
  uws?: {
    [P in keyof WebSocketBehavior]: WebSocketBehavior[P];
  };
}): Promise<WebSocketBehavior> {
  const { options, uws = null } = settings;
  const { schema, options: graphqlOpts = null, graphql = Graphql, contextValue = {}, contextFxn = undefined } = options;

  let uwsOptions: WebSocketBehavior = {
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
  const behavior: WebSocketBehavior = {
    open: (ws) => {
      ws.opId = ++connectedUsersCount;
    },
    message: async (ws, message) => {
      const { type, payload, id: reqOpId }: GraphqlWsMessage = JSON.parse(Buffer.from(message).toString('utf8'));
      const { query, ...graphqlMainOpts } = payload;

      let opId: number = connectedUsersCount;
      if (reqOpId) {
        opId = reqOpId;
      }

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

      switch (type) {
        case 'start':
          // eslint-disable-next-line no-case-declarations
          let asyncIterable = await subscribe(graphqlOptions);
          asyncIterable = (isAsyncIterable(asyncIterable)
            ? asyncIterable
            : createAsyncIterator([asyncIterable])) as AsyncIterableIterator<ExecutionResult>;

          forAwaitEach(asyncIterable, (result) =>
            ws.send(
              JSON.stringify({
                id: opId,
                type: 'data',
                payload: result,
              }),
            ),
          );
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
