import express, {
    Express,
    NextFunction,
    Request,
    RequestHandler,
    Response,
    Router,
} from 'express';
import 'reflect-metadata';

import {
    afterResponseExecutionHookSymbol,
    controllerMetaSymbol,
    directMiddlewareSymbol,
    endpointMetaSymbol,
    middlewareControllerKey,
    paramMetaSymbol,
    preExecutionHookSymbol,
} from '../decorators/symbols';

import {
    ControllerMeta,
    CreatedEndpointInfo,
    EndpointFunc,
    PreHook,
    EndpointInfo,
    EndpointParamMeta,
    GenericLogger,
    IMiddlewareGenerator,
    REST_METHODS, AfterExecHook,
} from './aq-base.types';
import {DefaultCasters} from './default-casters.helper';
import {CustomResponse} from "./custom-response.class";

/**
 * BaseController is the class that every controller should extend.
 * When BaseController is initialized, gets all the stored metadata from the decorators:
 * Class Decorators: @Controller,
 * Method Decorators: @Get/@Post/@Put/@Patch/@Delete
 * Parameter Decorators: @Body/@Query/@Param/@Req/@Res
 * And creates the proper routes and endpoints with the proper middleware
 */
export abstract class BaseController {
    private readonly endpointInfo: EndpointInfo[];

    private controllerMeta: ControllerMeta;

    constructor(
        private app: Express,
        private mainRoutePath: string,
        private casters: DefaultCasters,
        private generateTraceId: (req: Request) => string,
        private getLogger: (funcName: string, path?: string) => GenericLogger,
        private middlewareGenerator: IMiddlewareGenerator | undefined,
        private bundleName: string | undefined,
    ) {
        this.endpointInfo = Reflect.getMetadata(endpointMetaSymbol, this);
        this.controllerMeta = Reflect.getMetadata(
            controllerMetaSymbol,
            this.constructor,
        );

        this.createEndpoints();
        this.afterInit();
    }

    // Dummy function in order to run after the initialization of controller
    // @skipcq - this method is used by the library users
    protected afterInit() {
    }

    /**
     * Initialization of the creation of the endpoints
     * @return {void}
     * @private
     */
    private createEndpoints(): void {
        const router = express.Router();
        const createdEndpoints: CreatedEndpointInfo[] = [];

        for (const endpoint of this.endpointInfo) {
            const endpointParamMeta = Reflect.getMetadata(
                paramMetaSymbol,
                this,
                endpoint.methodName,
            ) as EndpointParamMeta[];
            // Get any pre-execution endpoint hook that defined with Decorators using the "createEndpointPreExecutionHook" function
            const preExecHooks = (Reflect.getMetadata(
                preExecutionHookSymbol,
                this,
                endpoint.methodName,
            ) || []) as PreHook[];

            const afterResponseHooks = (Reflect.getMetadata(
                afterResponseExecutionHookSymbol,
                this,
                endpoint.methodName,
            ) || []) as AfterExecHook[];
            createdEndpoints.push(
                this.createEndpoint(
                    router,
                    this.controllerMeta.basePath,
                    endpoint,
                    endpointParamMeta,
                    endpoint.methodName,
                    endpoint.method,
                    this.bundleName,
                    preExecHooks,
                    afterResponseHooks,
                ),
            );
        }

        this.app.use(this.mainRoutePath, router);
        this.printEndpointInfo(createdEndpoints, this.constructor.name);
    }

    /**
     * Creates a single endpoint
     * @param {Router} router - The base express router to create the endpoints on
     * @param {string} basePath - the controllers base path
     * @param {EndpointInfo} endpoint - the metadata that where saved by the method (endpoint) decorators
     * @param {EndpointParamMeta[]} endpointParamMeta - the metadata that where saved by the parameter decorators
     * @param {string} methodName - the name of the class method
     * @param {REST_METHODS | null} method - the HTTP method
     * @param bundleName
     * @param preHooks
     * @param afterResponseHooks
     * @return { {HTTPMethod: string, path: string, methodName: string} }
     * @private
     */
    private createEndpoint(
        router: Router,
        basePath: string,
        endpoint: EndpointInfo,
        endpointParamMeta: EndpointParamMeta[],
        methodName: string,
        method: REST_METHODS | null,
        bundleName: string | undefined,
        preHooks: PreHook[],
        afterResponseHooks: AfterExecHook[],
    ): CreatedEndpointInfo {
        const endpointPath = `${basePath}/${endpoint.path}`;
        const path = `/${endpointPath}`.replace(/\/+/g, '/');
        const endpointMethod: REST_METHODS = (
            method || BaseController.getMethod(endpoint.path)
        ).toUpperCase() as REST_METHODS;

        const endpointFunc = this.createEndpointFunc(
            endpoint.descriptor.value.bind(this),
            endpointParamMeta,
            endpoint.autoResponse,
            path,
            endpoint.target,
            bundleName,
            preHooks,
            afterResponseHooks,
        );

        const middleware = this.getMiddleware(endpoint.target, methodName);
        middleware.push(endpointFunc);
        router[REST_METHODS[endpointMethod]](path, ...middleware);

        return {
            HTTPMethod: endpointMethod,
            path,
            methodName,
            endpointParamMeta,
        };
    }

    // @skipcq - cannot figure out the proper type for this
    getMiddleware(target: any, methodName: string) {
        const directMiddleware = [];
        const directMiddlewareMeta = Reflect.getMetadata(
            directMiddlewareSymbol,
            target,
        );
        if (directMiddlewareMeta?.[methodName]) {
            directMiddleware.push(...directMiddlewareMeta[methodName]);
        }
        const options = {
            controllerOptions: undefined,
            endpointOptions: undefined,
        };

        if (!this.middlewareGenerator) return directMiddleware;

        const symbols = this.middlewareGenerator.getMiddlewareSymbols();

        for (const middlewareSymbol of symbols) {
            const endpointsMeta = Reflect.getMetadata(middlewareSymbol, target);
            const classMeta = Reflect.getMetadata(
                middlewareSymbol,
                target.constructor,
            );

            if (endpointsMeta?.[methodName]) {
                if (!options.endpointOptions)
                    options.endpointOptions = {[middlewareSymbol]: []};
                if (!options.endpointOptions[middlewareSymbol])
                    options.endpointOptions[middlewareSymbol] = [];
                options.endpointOptions[middlewareSymbol].push(
                    ...endpointsMeta[methodName],
                );
            }

            if (classMeta?.[middlewareControllerKey]) {
                if (!options.controllerOptions)
                    options.controllerOptions = {[middlewareSymbol]: []};
                if (!options.controllerOptions[middlewareSymbol])
                    options.controllerOptions[middlewareSymbol] = [];
                options.controllerOptions[middlewareSymbol].push(
                    ...classMeta[middlewareControllerKey],
                );
            }
        }

        const {controllerOptions, endpointOptions} = options;
        const generatorMiddleware = this.middlewareGenerator.getMiddleware(
            controllerOptions,
            endpointOptions,
        );
        return [...directMiddleware, ...generatorMiddleware];
    }

    /**
     * Generates a pseudo-random unique id (based on timestamp and 6 digit random)
     * @return {string}
     * @private
     */
    private static generateCallStackId(): string {
        return Number(`${Date.now()}${Math.floor(Math.random() * 100000)}`)
            .toString(36)
            .toUpperCase()
            .padEnd(12, '*')
            .replace(/^(.{4})(.{4})(.{4})/, '$1-$2-$3');
    }

    /**
     * Returns the actual function (which wraps the controller method) that will be passed in the router
     * @param {EndpointFunc} endpointFunc - the method of the controller that should be invoked on endpoint trigger
     * @param {EndpointParamMeta[]} paramMeta - the parameter metadata (gathered by the param decorators)
     * @param {boolean} autoResponse - flag that defines, if after the invocation of the endpointFunc should the return value as the http response
     * @param {string} path -the sub-route of the endpoint
     * @param targetClass
     * @param bundleName
     * @param endpointHooks
     * @param afterExecHooks
     * @return {ExpressRouteFunc}
     * @private
     */
    private createEndpointFunc(
        endpointFunc: EndpointFunc,
        paramMeta: EndpointParamMeta[],
        autoResponse: boolean,
        path: string,
        // @skipcq - cannot figure out the proper type for this
        targetClass: any,
        bundleName: string | undefined,
        endpointHooks: PreHook[],
        afterExecHooks: AfterExecHook[],
    ): RequestHandler {
        const getLogger = this.getLogger;
        const {casters, generateTraceId} = this;
        return function actualEndpointController(req: Request, res: Response, next: NextFunction) {
            const traceId = generateTraceId ? generateTraceId(req) : BaseController.generateCallStackId()
            try {
                const callStackIdPattern = `__REEF_CALL_STACK_${traceId}__END_OF_REEF__`
                res.locals.reef = {...res.locals.reef, traceId, bundleName}
                const funcWrapper: { [key: string]: () => Promise<void> } = {}
                funcWrapper[callStackIdPattern] = async function tackerFunc() {
                    const funcDef = `${targetClass?.constructor?.name}.${endpointFunc?.name?.replace('bound ', '')}`
                    const logger = getLogger(funcDef, path)

                    let endpointErr: Error | undefined
                    const loggerTitle = `${path} -> ${funcDef}`
                    let endpointVars: unknown[] = []
                    // we set this var so on finally to be able to pass the response on the afterResponseHooks
                    let resPayload = null
                    try {
                        endpointVars = await BaseController.getEndpointInputVars(
                            req,
                            res,
                            paramMeta,
                            casters,
                            logger,
                            next,
                        )
                        logger.info(`${loggerTitle} endpoint invoked`)
                        if (autoResponse) res.header('x-trace-id', traceId)

                        // resolve all the promises from the injected variables
                        // Run the endpoints pre-execution hooks

                        const hookPromises = []
                        for (const {params, preHook} of endpointHooks) {
                            hookPromises.push(preHook(params, endpointVars, req, res, paramMeta))
                        }
                        await Promise.all(hookPromises)

                        // Run the endpoint function
                        const endpointResponse = await endpointFunc(...endpointVars)
                        // Handle the endpoint response
                        if (autoResponse) {
                            resPayload = BaseController.handleSuccessResponse(endpointResponse, res)
                        }
                    } catch (err) {
                        endpointErr = err as Error
                        BaseController.handleResponseError(err as Error, req, res, next, logger)
                    } finally {
                        logger.info(`${loggerTitle} endpoint responded ${endpointErr ? 'with error' : 'successfully'}.`)
                        BaseController.handleAfterExecHooks(afterExecHooks, resPayload, endpointErr, endpointVars, res, req, paramMeta, logger)
                    }
                }
                funcWrapper[callStackIdPattern]()
            } catch (e) {
                const logger = getLogger(endpointFunc.name, path)
                BaseController.handleResponseError(e as Error, req, res, next, logger)
            }
        }
    }

    static handleAfterExecHooks(
        afterExecHooks: AfterExecHook[],
        resPayload: unknown,
        endpointErr: Error | undefined,
        endpointVars: unknown[],
        res: Response,
        req: Request,
        paramMeta: EndpointParamMeta[],
        logger: GenericLogger,
    ) {
        if (!afterExecHooks?.length) return
        for (const { params, hook } of afterExecHooks) {
            hook(params, endpointVars, resPayload, endpointErr, req, res, paramMeta, logger)
        }
    }

    static handleSuccessResponse(endpointResponse: CustomResponse | unknown, res: Response) {
        let responsePayload = endpointResponse
        if (endpointResponse instanceof CustomResponse) {
            const headers = endpointResponse.getHeaders()
            if (headers?.length) {
                for (const [headerName, headerValue] of headers) {
                    res.setHeader(headerName, headerValue)
                }
            }

            const statusCode = endpointResponse.getStatusCode()
            if (statusCode) {
                res.status(statusCode)
            }

            responsePayload = endpointResponse.getPayload() || ''

        }

        res.json(responsePayload)
        return responsePayload
    }

    /**
     * Function that handles the unsuccessful invocation of an endpoint function
     * @param {Error} err - raised the error
     * @param _req
     * @param {Response} _res - the express Response Object
     * @param next
     * @param {GenericLogger} logger - the logger
     * @return {void}
     * @private
     */
    private static handleResponseError(
        err: unknown,
        _req: Request,
        _res: Response,
        next: NextFunction,
        logger: GenericLogger,
    ): void {
        let mutErr = err;
        if (!(mutErr instanceof Error)) {
            logger.error(`!Important, thrown non-error item: ${err}`);
            mutErr = new Error(String(err));
        }
        next(mutErr);
    }

    /**
     * Function that given the request object and the endpoint parameters meta (that gathered by the param decorators) returns an array that contains the
     * values of the parameters that should be passed on the controller method.
     * @param {Request} req - the express Request object
     * @param {Response} res - the express Response object
     * @param {EndpointParamMeta[]} endpointParamMeta - the parameter info of the controller method
     * @param {DefaultCasters} casters - the Casters
     * @param logger
     * @param next
     * @return {unknown[]}
     * @private
     */
    private static async getEndpointInputVars(
        req: Request,
        res: Response,
        endpointParamMeta: EndpointParamMeta[],
        casters: DefaultCasters,
        logger: GenericLogger,
        next: NextFunction,
    ): Promise<unknown[]> {
        // eslint-disable-next-line no-param-reassign
        if (!endpointParamMeta) endpointParamMeta = []
        const inputVarsPromises = Array(endpointParamMeta.length)
        // eslint-disable-next-line no-restricted-syntax
        for (const [index, meta] of endpointParamMeta.entries()) {
            if (!meta) {
                logger.warn(`endpoint function input variable has no decorator on index ${index}`)
                continue
            }
            const paramVarP = BaseController.getParamVar(req, res, meta, casters, next)
            if (paramVarP instanceof Promise) inputVarsPromises[meta.index] = await paramVarP
            else inputVarsPromises[meta.index] = paramVarP
        }

        return inputVarsPromises
    }

    /**
     * Returns the single value of a parameter of a controller method
     * @param {Request} req - the express Request object
     * @param {Response} res - the express Response object
     * @param {EndpointParamMeta} meta - the parameter info of the controller method
     * @param {CasterClass} casters - the Casters
     * @param next
     * @return {unknown}
     * @private
     */
    private static getParamVar(
        req: Request,
        res: Response,
        meta: EndpointParamMeta,
        casters: DefaultCasters,
        next: NextFunction,
    ): unknown {
        return meta.actions.getValue(req, res, casters, meta, next);
    }

    /**
     * Method that calculates the type of http method from the endpoint path
     * @param endpointPath
     * @return {string}
     * @private
     */
    private static getMethod(endpointPath: string): REST_METHODS {
        let method = REST_METHODS.POST;
        if (endpointPath.includes('get') || endpointPath.includes('list'))
            method = REST_METHODS.GET;
        if (endpointPath.includes('update')) method = REST_METHODS.PATCH;
        if (endpointPath.includes('delete')) method = REST_METHODS.DELETE;
        if (endpointPath.includes('create')) method = REST_METHODS.POST;

        return method;
    }

    /**
     * Just prints the endpoints that where created
     * @param endpointsInfo
     * @param controllerName
     * @return {void}
     * @private
     */
    private printEndpointInfo(
        endpointsInfo: CreatedEndpointInfo[],
        controllerName: string,
    ): void {
        const logger = this.getLogger('Endpoint Information');
        const controllerInfo = {
            Controller: controllerName,
            endpoints: [] as unknown[],
        };
        for (const ep of endpointsInfo) {
            controllerInfo.endpoints.push({
                Method: ep.HTTPMethod,
                Function: ep.methodName,
                Path: `${this.mainRoutePath}${ep.path}`.replaceAll(/\/+/g, '/'),
            });
        }

        logger.debug(`Controller: "${controllerName}" Registered`);
    }

    // @skipcq - this method is used by the library users
    public reef(): CustomResponse {
        return new CustomResponse();
    }
}
