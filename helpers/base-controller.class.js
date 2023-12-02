"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const symbols_1 = require("../decorators/symbols");
const aq_base_types_1 = require("./aq-base.types");
class BaseController {
    constructor(app, mainRoutePath, casters, generateTraceId, getLogger, middlewareGenerator, bundleName) {
        this.app = app;
        this.mainRoutePath = mainRoutePath;
        this.casters = casters;
        this.generateTraceId = generateTraceId;
        this.getLogger = getLogger;
        this.middlewareGenerator = middlewareGenerator;
        this.bundleName = bundleName;
        this.endpointInfo = Reflect.getMetadata(symbols_1.endpointMetaSymbol, this);
        this.controllerMeta = Reflect.getMetadata(symbols_1.controllerMetaSymbol, this.constructor);
        this.createEndpoints();
        this.afterInit();
    }
    afterInit() { }
    createEndpoints() {
        const router = express_1.default.Router();
        const createdEndpoints = [];
        for (const endpoint of this.endpointInfo) {
            const endpointParamMeta = Reflect.getMetadata(symbols_1.paramMetaSymbol, this, endpoint.methodName);
            const endpointHooks = (Reflect.getMetadata(symbols_1.preExecutionHookSymbol, this, endpoint.methodName) || []);
            createdEndpoints.push(this.createEndpoint(router, this.controllerMeta.basePath, endpoint, endpointParamMeta, endpoint.methodName, endpoint.method, this.bundleName, endpointHooks));
        }
        this.app.use(this.mainRoutePath, router);
        this.printEndpointInfo(createdEndpoints, this.constructor.name);
    }
    createEndpoint(router, basePath, endpoint, endpointParamMeta, methodName, method, bundleName, endpointHooks) {
        const endpointPath = `${basePath}/${endpoint.path}`;
        const path = `/${endpointPath}`.replace(/\/+/g, '/');
        const endpointMethod = (method || this.getMethod(endpoint.path)).toUpperCase();
        const endpointFunc = this.createEndpointFunc(endpoint.descriptor.value.bind(this), endpointParamMeta, endpoint.autoResponse, path, endpoint.target, bundleName, endpointHooks);
        const middleware = this.getMiddleware(endpoint.target, methodName);
        middleware.push(endpointFunc);
        router[aq_base_types_1.REST_METHODS[endpointMethod]](path, ...middleware);
        return {
            HTTPMethod: endpointMethod,
            path,
            methodName,
            endpointParamMeta,
        };
    }
    getMiddleware(target, methodName) {
        const directMiddleware = [];
        const directMiddlewareMeta = Reflect.getMetadata(symbols_1.directMiddlewareSymbol, target);
        if (directMiddlewareMeta?.[methodName]) {
            directMiddleware.push(...directMiddlewareMeta[methodName]);
        }
        const options = {
            controllerOptions: undefined,
            endpointOptions: undefined,
        };
        if (!this.middlewareGenerator)
            return directMiddleware;
        const symbols = this.middlewareGenerator.getMiddlewareSymbols();
        for (const middlewareSymbol of symbols) {
            const endpointsMeta = Reflect.getMetadata(middlewareSymbol, target);
            const classMeta = Reflect.getMetadata(middlewareSymbol, target.constructor);
            if (endpointsMeta?.[methodName]) {
                if (!options.endpointOptions)
                    options.endpointOptions = { [middlewareSymbol]: [] };
                if (!options.endpointOptions[middlewareSymbol])
                    options.endpointOptions[middlewareSymbol] = [];
                options.endpointOptions[middlewareSymbol].push(...endpointsMeta[methodName]);
            }
            if (classMeta?.[symbols_1.middlewareControllerKey]) {
                if (!options.controllerOptions)
                    options.controllerOptions = { [middlewareSymbol]: [] };
                if (!options.controllerOptions[middlewareSymbol])
                    options.controllerOptions[middlewareSymbol] = [];
                options.controllerOptions[middlewareSymbol].push(...classMeta[symbols_1.middlewareControllerKey]);
            }
        }
        const { controllerOptions, endpointOptions } = options;
        const generatorMiddleware = this.middlewareGenerator.getMiddleware(controllerOptions, endpointOptions);
        return [...directMiddleware, ...generatorMiddleware];
    }
    static generateCallStackId() {
        return Number(`${Date.now()}${Math.floor(Math.random() * 100000)}`)
            .toString(36)
            .toUpperCase()
            .padEnd(12, '*')
            .replace(/^(.{4})(.{4})(.{4})/, '$1-$2-$3');
    }
    createEndpointFunc(endpointFunc, endpointMeta, autoResponse, path, targetClass, bundleName, endpointHooks) {
        const getLogger = this.getLogger;
        const { casters, generateTraceId } = this;
        return function actualEndpointController(req, res, next) {
            const traceId = generateTraceId
                ? generateTraceId(req)
                : BaseController.generateCallStackId();
            try {
                const callStackIdPattern = `__REEF_CALL_STACK_${traceId}__END_OF_REEF__`;
                res.locals.reef = { ...res.locals.reef, traceId, bundleName };
                const funcWrapper = {};
                funcWrapper[callStackIdPattern] = async function tackerFunc() {
                    const funcDef = `${targetClass?.constructor?.name}.${endpointFunc?.name?.replace('bound ', '')}`;
                    const logger = getLogger(funcDef, path);
                    try {
                        const endpointVarPromises = BaseController.getEndpointInputVars(req, res, endpointMeta, casters, logger, next);
                        const loggerTitle = `${path} -> ${funcDef}`;
                        logger.info(`${loggerTitle} endpoint invoked`);
                        if (autoResponse)
                            res.header('x-trace-id', traceId);
                        let endpointErr;
                        Promise.all(endpointVarPromises)
                            .then((endpointVars) => {
                            const hookPromises = [];
                            for (const { params, preHook } of endpointHooks) {
                                hookPromises.push(preHook(params, endpointVars, req, res, endpointMeta));
                            }
                            return Promise.all(hookPromises).then(() => endpointVars);
                        })
                            .then((endpointVars) => endpointFunc(...endpointVars))
                            .then((endpointResponse) => autoResponse && res.json(endpointResponse))
                            .catch((err) => {
                            endpointErr = err;
                            if (!(err instanceof Error)) {
                                logger.error(`!Important, thrown non-error item: ${err}`);
                                err = new Error(err);
                            }
                            next(err);
                        })
                            .finally(() => {
                            logger.info(`${loggerTitle} endpoint responded ${endpointErr ? 'with error' : 'successfully'}.`);
                        });
                    }
                    catch (err) {
                        BaseController.handleResponseError(err, req, res, next, logger);
                    }
                };
                funcWrapper[callStackIdPattern]();
            }
            catch (e) {
                const logger = getLogger(endpointFunc.name, path);
                BaseController.handleResponseError(e, req, res, next, logger);
            }
        };
    }
    static handleResponseError(err, _req, _res, next, logger) {
        let mutErr = err;
        if (!(mutErr instanceof Error)) {
            logger.error(`!Important, thrown non-error item: ${err}`);
            mutErr = new Error(String(err));
        }
        next(mutErr);
    }
    static getEndpointInputVars(req, res, endpointParamMeta, casters, logger, next) {
        if (!endpointParamMeta)
            endpointParamMeta = [];
        const inputVarsPromises = Array(endpointParamMeta.length);
        for (const [index, meta] of endpointParamMeta.entries()) {
            if (!meta) {
                logger.warn(`endpoint function input variable has no decorator on index ${index}`);
                continue;
            }
            const paramVar = BaseController.getParamVar(req, res, meta, casters, next);
            if (paramVar instanceof Promise)
                inputVarsPromises[meta.index] = paramVar;
            else
                inputVarsPromises[meta.index] = Promise.resolve(paramVar);
        }
        return inputVarsPromises;
    }
    static getParamVar(req, res, meta, casters, next) {
        return meta.actions.getValue(req, res, casters, meta, next);
    }
    getMethod(endpointPath) {
        let method = aq_base_types_1.REST_METHODS.POST;
        if (endpointPath.includes('get') || endpointPath.includes('list'))
            method = aq_base_types_1.REST_METHODS.GET;
        if (endpointPath.includes('update'))
            method = aq_base_types_1.REST_METHODS.PATCH;
        if (endpointPath.includes('delete'))
            method = aq_base_types_1.REST_METHODS.DELETE;
        if (endpointPath.includes('create'))
            method = aq_base_types_1.REST_METHODS.POST;
        return method;
    }
    printEndpointInfo(endpointsInfo, controllerName) {
        const logger = this.getLogger('Endpoint Information');
        const controllerInfo = {
            Controller: controllerName,
            endpoints: [],
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
}
exports.BaseController = BaseController;
//# sourceMappingURL=base-controller.class.js.map