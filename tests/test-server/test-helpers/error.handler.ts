import { NextFunction, Request, Response } from 'express-serve-static-core';

export function TestErrorHandler(
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) {
	return res
		.status(505)
		.json({ message: 'passed error handler', err: err.message });
}
