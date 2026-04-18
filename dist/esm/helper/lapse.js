function normalizeCause(cause) {
    if (cause instanceof Lapse)
        return cause.toJSON();
    if (cause instanceof Error)
        return {
            name: cause.name,
            message: cause.message,
            stack: cause.stack
        };
    return cause;
}
class Lapse extends Error {
    code;
    status;
    cause;
    constructor(message, code, status, cause) {
        super(message);
        this.name = 'ZING_MP3_ERROR';
        this.code = code;
        this.status = status;
        this.cause = cause;
        Object.setPrototypeOf(this, new.target.prototype);
        if (Error.captureStackTrace)
            Error.captureStackTrace(this, new.target);
    }
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            status: this.status,
            cause: normalizeCause(this.cause),
            stack: this.stack
        };
    }
    toString() {
        return this.name + ': ' + this.message + '[' + this.code + ']';
    }
}
export { Lapse };
