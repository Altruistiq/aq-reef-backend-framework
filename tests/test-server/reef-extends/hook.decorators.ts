import {Request, Response} from "express";
import {createAfterResponseExecutionHook} from "../reef";
import {EndpointParamMeta, GenericLogger} from "../reef/helpers";

export function AfterExecHook(params: unknown) {
    return createAfterResponseExecutionHook(params, afterResponseHookFn)
}

async function afterResponseHookFn(
    params: unknown,
    endpointVariables: unknown[],
    responseObj: unknown,
    error: Error | undefined,
    req: Request,
    _res: Response,
    _paramMeta: EndpointParamMeta[],
    logger: GenericLogger
) {
    logger.debug({
        params,
        endpointVariables,
        responseObj,
        error,
        req: {
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers
        }
    })
}