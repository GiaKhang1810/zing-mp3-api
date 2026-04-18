interface LapseObject {
    name: string;
    message: string;
    code: string;
    status?: number;
    cause?: unknown;
    stack?: string;
}
export type { LapseObject };
declare class Lapse extends Error {
    readonly code: string;
    readonly status?: number;
    cause?: unknown;
    constructor(message: string, code: string, status?: number, cause?: unknown);
    toJSON(): LapseObject;
    toString(): string;
}
export { Lapse };
