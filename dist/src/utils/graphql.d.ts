import { HttpResponse, HttpRequest, WebSocketBehavior, WebSocket } from 'uWebSockets.js';
import { GraphQLSchema, ExecutionArgs, SubscriptionArgs } from 'graphql';
import * as Graphql from 'graphql';
import { ParsedData, ParseDataOptions } from './functions';
export declare type GraphqlOptions<T> = {
    [P in keyof T]: T[P];
};
export declare type GraphqlParams = {
    query: string;
    variableValues: {
        [key: string]: unknown;
    };
    operationName: string;
};
export declare type GraphqlCallbackData = {
    ws: WebSocket;
};
export declare type GraphqlFxOptions<T> = {
    schema: GraphQLSchema | ((parsedData: ParsedData | GraphqlCallbackData) => GraphQLSchema | Promise<GraphQLSchema>);
    options?: GraphqlOptions<T>;
    graphql?: typeof Graphql;
    contextValue?: unknown;
    contextFxn?: (parsedData: ParsedData | GraphqlCallbackData) => unknown | Promise<unknown>;
};
export declare type GraphqlParsedData = ParsedData & Required<Pick<ParsedData, 'method' | 'query' | 'body'>>;
export declare function getGraphqlParams(parsedData: GraphqlParsedData): Promise<GraphqlParams>;
export declare function generateGraphqlHandler(res: HttpResponse, req: HttpRequest, settings: ParseDataOptions & {
    graphql: GraphqlFxOptions<ExecutionArgs>;
}): Promise<void>;
export declare type GraphqlWsMessage = {
    type: 'start' | 'stop' | 'query';
    payload: GraphqlParams;
    id: number;
};
export declare function generateGraphqlWsHandler(settings: {
    options: GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>;
    uws?: {
        [P in keyof WebSocketBehavior]: WebSocketBehavior[P];
    };
}): Promise<WebSocketBehavior>;
//# sourceMappingURL=graphql.d.ts.map