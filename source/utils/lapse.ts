export class Lapse extends Error {
    public readonly code: string;
    public status?: number;
    public override cause?: unknown;

    public constructor(message: string, code: string, status?: number, cause?: unknown) {
        super(message);

        this.name = 'ZING_MP3_ERROR';
        this.code = code;
        this.status = status;
        this.cause = cause;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}