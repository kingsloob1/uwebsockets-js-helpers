/// <reference types="node" />
/// <reference types="busboy" />
import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { Readable } from 'stream';
export declare function ResDataToStream(res: HttpResponse, ...options: ConstructorParameters<typeof Readable>): InstanceType<typeof Readable>;
export declare function writeHeaders(res: HttpResponse, headers: {
    [name: string]: string;
} | string, other?: string): void;
export declare function stob(stream: Readable, maxSize?: number): Promise<Buffer>;
export declare type FileInfo = {
    fieldname: string;
    filename: string;
    encoding: string;
    mimetype: string;
    file: NodeJS.ReadableStream;
};
export declare type ParseDataOptions = {
    namespace?: string;
    headers?: boolean;
    body?: boolean;
    query?: boolean;
    path?: boolean;
    method?: boolean;
    bodyOptions?: busboy.BusboyConfig;
    customBodyOptions?: {
        handle?: ((options?: FileInfo) => boolean | Promise<boolean>) | boolean;
        tmpDir?: ((options?: FileInfo) => string | Promise<string>) | string;
        folder?: ((options?: FileInfo) => string | Promise<string>) | string;
        saveAs?: ((options?: FileInfo) => string | Promise<string>) | string;
    };
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
export declare function parseData(req: HttpRequest, res: HttpResponse, options: ParseDataOptions): Promise<ParsedData>;
//# sourceMappingURL=functions.d.ts.map