"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraceId = void 0;
function getTraceId() {
    const err = new Error();
    const traceIdSearch = /\[as __REEF_CALL_STACK_(.+?)__END_OF_REEF__]/gm.exec(err.stack);
    if (!traceIdSearch)
        return undefined;
    return traceIdSearch[1];
}
exports.getTraceId = getTraceId;
//# sourceMappingURL=trace-id.helper.js.map