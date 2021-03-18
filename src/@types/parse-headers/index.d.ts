declare module 'parse-headers' {
  function parse(data: string[]): { [key: string]: string | string[] };
  export = parse;
}
