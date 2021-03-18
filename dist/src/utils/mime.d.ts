export interface MimeDefinition {
    [key: string]: string;
}
declare const mimes: MimeDefinition;
declare const getMime: (path: string) => string;
export { getMime, mimes };
//# sourceMappingURL=mime.d.ts.map