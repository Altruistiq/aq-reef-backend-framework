export declare class ApiError extends Error {
    message: string;
    meta?: {
        [key: string]: any;
    };
    constructor(message: string, meta?: {
        [key: string]: any;
    });
}
