export function getTraceId(): string | undefined {
  const err = new Error()
  const traceIdSearch = /\[as __AQ_CALL_STACK_(.+?)__END_OF_AQ__]/gm.exec(err.stack as string)
  if (!traceIdSearch) return undefined
  return traceIdSearch[1]
}
