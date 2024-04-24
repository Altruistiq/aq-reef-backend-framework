import type { Response } from "express";

export function getTraceId(res?: Response): string | undefined {
	if (res?.locals?.reef?.traceId) return res.locals.reef.traceId;
	const err = new Error();
	const traceIdSearch = /\[as __REEF_CALL_STACK_(.+?)__END_OF_REEF__]/gm.exec(
		err.stack as string,
	);
	if (!traceIdSearch) return undefined;
	return traceIdSearch[1];
}
