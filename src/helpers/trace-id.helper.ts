export function getTraceId(): string | undefined {
	const err = new Error();
	const traceIdSearch = /\[as __REEF_CALL_STACK_(.+?)__END_OF_REEF__]/gm.exec(
		err.stack as string,
	);
	if (!traceIdSearch) return undefined;
	return traceIdSearch[1];
}
