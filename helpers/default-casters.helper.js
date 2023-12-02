"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultCasters = void 0;
const errors_1 = require("../errors");
class DefaultCasters {
    constructor() {
        this.ErrorClass = Error;
    }
    cast(meta, rawValue) {
        if (!meta.cast || !this[meta.type.name])
            return rawValue;
        if (rawValue instanceof meta.type)
            return rawValue;
        if (rawValue === undefined)
            return undefined;
        try {
            return this[meta.type.name](rawValue);
        }
        catch (err) {
            throw new errors_1.ResError('invalid_param_type', {
                param: meta.name,
                type: meta.type.name,
            });
        }
    }
    Number(input) {
        const transformed = Number(input);
        if (Number.isNaN(transformed)) {
            throw new this.ErrorClass('cannot_cast');
        }
        return transformed;
    }
    Boolean(input) {
        if (typeof input === 'boolean')
            return input;
        if (typeof input !== 'string' && typeof input !== 'number') {
            throw new this.ErrorClass('cannot_cast');
        }
        if (['1', 'true', 't'].indexOf(String(input).toLowerCase()) > -1) {
            return true;
        }
        if (['0', 'false', 'f'].indexOf(String(input).toLowerCase()) > -1) {
            return false;
        }
        throw new this.ErrorClass('cannot_cast');
    }
}
exports.DefaultCasters = DefaultCasters;
//# sourceMappingURL=default-casters.helper.js.map