import { HttpResponse, HttpRequest, WebSocketBehavior, WebSocket, us_socket_context_t } from 'uWebSockets.js';
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
    graphql: typeof Graphql;
    options?: GraphqlOptions<T>;
    contextValue?: unknown;
    contextFxn?: (parsedData: ParsedData | GraphqlCallbackData) => unknown | Promise<unknown>;
    handle?: ((parsedData: ParsedData | GraphqlCallbackData) => boolean | Promise<boolean>) | boolean;
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
export declare type GraphqlWsUpgradeHandlerData = GraphqlParsedData & {
    req: HttpRequest;
    res: HttpResponse;
    context: us_socket_context_t;
};
export interface GraphqlWebSocketBehavior extends Omit<WebSocketBehavior, 'upgrade'> {
    upgrade?: (data: GraphqlWsUpgradeHandlerData) => boolean | Promise<boolean>;
    open?: (ws: WebSocket) => boolean | Promise<boolean>;
    message?: (ws: WebSocket, message: ArrayBuffer, isBinary: boolean) => boolean | Promise<boolean>;
    close?: (ws: WebSocket, code: number, message: ArrayBuffer) => boolean | Promise<boolean>;
}
export declare function generateGraphqlWsHandler(settings: {
    options: GraphqlFxOptions<ExecutionArgs | SubscriptionArgs>;
    uws?: {
        [P in keyof GraphqlWebSocketBehavior]: GraphqlWebSocketBehavior[P];
    };
}): Promise<WebSocketBehavior>;
//# sourceMappingURL=graphql.d.ts.map