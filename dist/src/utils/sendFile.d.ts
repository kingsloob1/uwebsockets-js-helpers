/// <reference types="node" />
import { createBrotliCompress, createGzip, createDeflate } from 'zlib';
import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { Cache } from 'cache-manager';
export declare type SendFileOptions = {
    filter?: (path: string) => boolean;
    lastModified?: boolean;
    headers?: {
        [key: string]: string;
    };
    compress?: boolean;
    compressionOptions?: {
        priority?: ('gzip' | 'br' | 'deflate')[];
    };
    cache?: false | Cache;
};
export declare type Handler = (res: HttpResponse, req: HttpRequest) => void;
export declare const compressions: {
    br: typeof createBrotliCompress;
    gzip: typeof createGzip;
    deflate: typeof createDeflate;
};
declare function sendFile(res: HttpResponse, req: HttpRequest, path: string, options: SendFileOptions): void;
export default sendFile;
//# sourceMappingURL=sendFile.d.ts.map