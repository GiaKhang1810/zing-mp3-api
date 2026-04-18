type Params = Record<string, string | number>;
export type { Params };
export declare function createSignature(uri: string, params: Params, secret: string): string;
