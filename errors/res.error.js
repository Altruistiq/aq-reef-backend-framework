"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResError = void 0;
class ResError extends Error {
    constructor(message, meta) {
        super(message);
        this.message = message;
        this.meta = meta;
    }
}
exports.ResError = ResError;
//# sourceMappingURL=res.error.js.map