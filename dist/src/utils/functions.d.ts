/// <reference types="node" />
/// <reference types="busboy" />
import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { ReadStream } from 'fs';
declare function writeHeaders(res: HttpResponse, headers: {
    [name: string]: string;
} | string, other?: string): void;
declare function stob(stream: ReadStream): Promise<Buffer>;
export declare type ParseDataOptions = {
    namespace?: string;
    headers?: boolean;
    body?: boolean;
    query?: boolean;
    path?: boolean;
    method?: boolean;
    bodyOptions?: busboy.BusboyConfig;
};
export declare type BodyType = {
    [key: string]: unknown;
};
export declare type ParsedData = {
    headers?: {
        [key: string]: string | string[];
    };
    body?: BodyType;
    query?: {
        [key: string]: unknown;
    };
    path?: string;
    method?: string;
};
declare function parseData(req: HttpRequest, res: HttpResponse, options: ParseDataOptions): Promise<ParsedData>;
export { writeHeaders, stob, parseData };
//# sourceMappingURL=functions.d.ts.map