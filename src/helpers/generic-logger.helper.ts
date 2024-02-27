import {getTraceId} from "./trace-id.helper";
import {GenericLogger} from "./aq-base.types";

export function getLogger(functionName: string, uri?: string, traceId?: string): GenericLogger {
  if (!traceId) traceId = getTraceId()

  const info = `[${functionName}${uri ? `(${uri})` : ''} --> Trace: ${traceId}]: `

  return {
    warn: console.warn.bind(null, info),
    error: console.error.bind(null, info),
    debug: console.debug.bind(null, info),
    info: console.info.bind(null, info),
  }
}
