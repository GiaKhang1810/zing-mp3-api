interface LapseJSON {
    name: string;
    message: string;
    code: string;
    status?: number;
    cause?: unknown;
    stack?: string;
}
export type { LapseJSON };
declare class Lapse extends Error {
    readonly code: string;
    readonly status?: number;
    cause?: unknown;
    constructor(message: string, code: string, status?: number, cause?: unknown);
    toJSON(): LapseJSON;
    toString(): string;
}
export { Lapse };
