interface LapseObject {
    name: string;
    message: string;
    code: string;
    status?: number;
    cause?: unknown;
    stack?: string;
}

export type {
    LapseObject
}

function normalizeCause(cause: unknown): unknown {
    if (cause instanceof Lapse)
        return cause.toJSON();

    if (cause instanceof Error)
        return {
            name: cause.name,
            message: cause.message,
            stack: cause.stack
        }

    return cause;
}

class Lapse extends Error {
    public readonly code: string;
    public readonly status?: number;
    public override cause?: unknown;

    public constructor(message: string, code: string, status?: number, cause?: unknown) {
        super(message);

        this.name = 'ZING_MP3_ERROR';
        this.code = code;
        this.status = status;
        this.cause = cause;

        Object.setPrototypeOf(this, new.target.prototype);

        if (Error.captureStackTrace)
            Error.captureStackTrace(this, new.target);
    }

    public toJSON(): LapseObject {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            cause: normalizeCause(this.cause),
            stack: this.stack
        }
    }

    public override toString(): string {
        return this.name + ': ' + this.message + '[' + this.code + ']';
    }
}

export { 
    Lapse
}