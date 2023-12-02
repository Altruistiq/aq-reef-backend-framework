"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(message, meta) {
        super(message);
        this.message = message;
        this.meta = meta;
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=api.error.js.map