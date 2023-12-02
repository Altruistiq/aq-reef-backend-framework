export declare class ResError extends Error {
    message: string;
    meta?: {
        [key: string]: any;
    };
    constructor(message: string, meta?: {
        [key: string]: any;
    });
}
