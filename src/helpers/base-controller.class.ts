import 'reflect-metadata'
import express, { Express, Request, Response, Router } from 'express'

import {controllerMetaSymbol, endpointMetaSymbol, middlewareControllerKey, paramMetaSymbol} from '../decorators/symbols'

import {
  ControllerMeta,
  CreatedEndpointInfo, EndpointFunc,
  EndpointInfo,
  EndpointParamMeta, ExpressRouteFunc,
  GenericLogger,
  IMiddlewareGenerator, REST_METHODS,
} from './aq-base.types'
import { DefaultCasters } from './default-casters.helper'
import { getTraceId } from './trace-id.helper'
import {ApiError, ResError} from "../errors";
import Base = Mocha.reporters.Base;

/**
 * BaseController is the class that every controller should extend.
 * When BaseController is initialized, gets all the stored metadata from the decorators:
 * Class Decorators: @Controller,
 * Method Decorators: @Get/@Post/@Put/@Patch/@Delete
 * Parameter Decorators: @Body/@Query/@Param/@Req/@Res
 * And creates the proper routes and endpoints with the proper middleware
 */
export abstract class BaseController {
  private endpointInfo: EndpointInfo[]

  private controllerMeta: ControllerMeta

  constructor(
    private app: Express,
    private mainRoutePath: string,
    private casters: DefaultCasters,
    private generateTraceId: (req: Request) => string,
    private getLogger: (funcName: string, path?: string) => GenericLogger,
    private middlewareGenerator: IMiddlewareGenerator | undefined,
    private hideLogsForErrors: string[]
  ) {
    this.endpointInfo = Reflect.getMetadata(endpointMetaSymbol, this)
    this.controllerMeta = Reflect.getMetadata(controllerMetaSymbol, this.constructor)

    this.createEndpoints()
    this.afterInit()
  }

  // Dummy function in order to run after the initialization of controller
  protected afterInit() {

  }

  /**
   * Initialization of the creation of the endpoints
   * @return {void}
   * @private
   */
  private createEndpoints() {
    const router = express.Router()
    const createdEndpoints: CreatedEndpointInfo[] = []

    for (const endpoint of this.endpointInfo) {
      const endpointParamMeta = Reflect.getMetadata(paramMetaSymbol, this, endpoint.methodName) as EndpointParamMeta[]

      createdEndpoints.push(
        this.createEndpoint(
          router,
          this.controllerMeta.basePath,
          endpoint,
          endpointParamMeta,
          endpoint.methodName,
          endpoint.method
        )
      )
    }

    this.app.use(this.mainRoutePath, router)
    this.printEndpointInfo(createdEndpoints, this.constructor.name)
  }

  /**
   * Creates a single endpoint
   * @param {Router} router - The base express router to create the endpoints on
   * @param {string} basePath - the controllers base path
   * @param {EndpointInfo} endpoint - the metadata that where saved by the method (endpoint) decorators
   * @param {EndpointParamMeta[]} endpointParamMeta - the metadata that where saved by the parameter decorators
   * @param {string} methodName - the name of the class method
   * @param {REST_METHODS | null} method - the HTTP method
   * @return { {HTTPMethod: string, path: string, methodName: string} }
   * @private
   */
  private createEndpoint(
    router: Router,
    basePath: string,
    endpoint: EndpointInfo,
    endpointParamMeta: EndpointParamMeta[],
    methodName: string,
    method: REST_METHODS | null
  ): CreatedEndpointInfo {
    const endpointPath = `${basePath}/${endpoint.path}`
    const path = `/${endpointPath}`.replace(/\/+/g, '/')
    const endpointMethod: REST_METHODS = (method || this.getMethod(endpoint.path)).toUpperCase() as REST_METHODS


    const endpointFunc = this.createEndpointFunc(
      endpoint.descriptor.value,
      endpointParamMeta,
      endpoint.autoResponse,
      path,
      endpoint.target
    )

    const middleware = this.getMiddleware(endpoint.target, methodName)
    middleware.push(endpointFunc)
    // @ts-ignore
    router[endpointMethod.toLowerCase()](path, ...middleware)

    return {
      HTTPMethod: endpointMethod,
      path,
      methodName,
      endpointParamMeta,
    }
  }

  getMiddleware(target: BaseController, methodName: string) {
    const options = {
      controllerOptions: undefined,
      endpointOptions: undefined,
    }

    if (!this.middlewareGenerator) return []

    const symbols = this.middlewareGenerator.getMiddlewareSymbols()


    for (const mwSymbol of symbols) {
      const meta = Reflect.getMetadata(mwSymbol, target)

      if (meta && meta[methodName]) {
        if (!options.endpointOptions) options.endpointOptions = { [mwSymbol]: [] }
        options.endpointOptions[mwSymbol].push(...meta[methodName])
      }

      if (meta && meta[controllerMetaSymbol]) {
        if (!options.controllerOptions) options.controllerOptions = { [mwSymbol]: [] }
        options.controllerOptions[mwSymbol].push(...meta[controllerMetaSymbol])
      }
    }

    const { controllerOptions, endpointOptions } = options
    return this.middlewareGenerator.getMiddleware(controllerOptions, endpointOptions)
  }


  /**
   * Generates a pseudo-random unique id (based on timestamp and 6 digit random)
   * @return {string}
   * @private
   */
  private static generateCallStackId() {
    return Number(`${Date.now()}${Math.floor(Math.random() * 100000)}`)
      .toString(36)
      .toUpperCase()
      .padEnd(12, '*')
      .replace(/^(.{4})(.{4})(.{4})/, '$1-$2-$3')
  }

  /**
   * Returns the actual function (which wraps the controller method) that will be passed in the router
   * @param {EndpointFunc} endpointFunc - the method of the controller that should be invoked on endpoint trigger
   * @param {EndpointParamMeta[]} endpointMeta - the parameter metadata (gathered by the param decorators)
   * @param {boolean} autoResponse - flag that defines, if after the invocation of the endpointFunc should the return value as the http response
   * @param {string} path -the sub-route of the endpoint
   * @param targetClass
   * @return {ExpressRouteFunc}
   * @private
   */
  private createEndpointFunc(
    endpointFunc: EndpointFunc,
    endpointMeta: EndpointParamMeta[],
    autoResponse: boolean,
    path: string,
    targetClass: any
  ): ExpressRouteFunc {
    const getLogger = this.getLogger
    const hideLogsForErrors = this.hideLogsForErrors
    const { casters, generateTraceId } = this
    return function actualEndpointController(req: Request, res: Response) {
      const traceId = generateTraceId ? generateTraceId(req) : BaseController.generateCallStackId()
      try {
        const callStackIdPattern = `__REEF_CALL_STACK_${traceId}__END_OF_REEF__`
        const funcWrapper: { [key: string]: () => Promise<void> } = {}
        funcWrapper[callStackIdPattern] = async function tackerFunc() {
          const funcDef = `${targetClass?.constructor?.name}.${endpointFunc?.name}`
          const logger = getLogger(funcDef, path)
          const endpointVars = BaseController.getEndpointInputVars(req, res, endpointMeta, casters, logger, funcDef)
          const loggerTitle = `${path} -> ${funcDef}`
          logger.info(`${loggerTitle} endpoint invoked`)
          const response: unknown = endpointFunc(...endpointVars)
          if (autoResponse) BaseController.handleResponse(response, res, traceId, logger, hideLogsForErrors)
        }
        funcWrapper[callStackIdPattern]().catch((err: Error) => {
          const logger = getLogger(endpointFunc.name, path)
          BaseController.handleResponseError(err, res, logger, hideLogsForErrors)
        })
      } catch (e) {
        const logger = getLogger(endpointFunc.name, path)
        let err: Error
        if (!(e instanceof Error)) err = new Error(String(e))
        else err = e
        BaseController.handleResponseError(err, res, logger, hideLogsForErrors)
      }
    }
  }

  /**
   * function that handles a successful response of an endpoint function
   * @param {Promise<unknown> | unknown} payload - the result of the invocation
   * @param {Response} res - the express Response Object
   * @param traceId
   * @param {GenericLogger} logger - the logger
   * @param hideLogsForErrors
   * @param loggerTitle
   * @return {void}
   * @private
   */
  private static handleResponse(
    payload: Promise<unknown> | unknown,
    res: Response,
    traceId: string,
    logger: GenericLogger,
    hideLogsForErrors: string[],
    loggerTitle?: string
  ) {
    let endpointErr: (Error | undefined)
    Promise.resolve(payload)
      .then((data: unknown) => {
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          // eslint-disable-next-line no-param-reassign
          if (!data.traceId && typeof data === 'object') data.traceId = traceId
        } finally {
          res
            .header('x-trace-id', traceId)
            .json(data)
        }
      })
      .catch((err: Error) => {
        endpointErr = err
        BaseController.handleResponseError(err, res, logger, hideLogsForErrors)
      })
      .finally(() => {
        if (endpointErr) {
          logger.info(`${loggerTitle} endpoint responded with error.`)
        } else {
          logger.info(`${loggerTitle} endpoint responded.`)
        }
      })
  }

  /**
   * Function that handles the unsuccessful invocation of an endpoint function
   * @param {Error} err - raised the error
   * @param {Response} res - the express Response Object
   * @param {GenericLogger} logger - the logger
   * @param {string[]} hideLogsForErrors - a list of error class names that won't be logged
   * @return {void}
   * @private
   */
  private static handleResponseError(err: Error, res: Response, logger: GenericLogger, hideLogsForErrors: string[]) {
    const traceId = getTraceId()
    if (err instanceof Error && !hideLogsForErrors.includes(err.constructor.name)) logger.error(err.message)

    if (err instanceof ApiError) {
      res.status(400).json({ error: { message: 'something went wrong' }, traceId })

    } else if (err instanceof ResError) {
      res.status(400).json({ error: { message: err.message, meta: err.meta }, traceId })

    } else {
      // eslint-disable-next-line no-param-reassign,@typescript-eslint/restrict-template-expressions
      if (!(err instanceof Error)) err = new Error(`!Important, thrown non-error item: ${err}`)
      logger.error(err)
      res.status(500).json({ error: { message: 'something went wrong' }, traceId })
    }
  }

  /**
   * Function that given the request object and the endpoint parameters meta (that gathered by the param decorators) returns an array that contains the
   * values of the parameters that should be passed on the controller method.
   * @param {Request} req - the express Request object
   * @param {Response} res - the express Response object
   * @param {EndpointParamMeta[]} endpointParamMeta - the parameter info of the controller method
   * @param {DefaultCasters} casters - the Casters
   * @param logger
   * @param funcName
   * @return {unknown[]}
   * @private
   */
  private static getEndpointInputVars(
    req: Request,
    res: Response,
    endpointParamMeta: EndpointParamMeta[],
    casters: DefaultCasters,
    logger: GenericLogger,
    funcName: string,
  ): unknown[] {
    // eslint-disable-next-line no-param-reassign
    if (!endpointParamMeta) endpointParamMeta = []
    const inputVars = Array(endpointParamMeta.length)
    // eslint-disable-next-line no-restricted-syntax
    for (const [index, meta] of endpointParamMeta.entries()) {
      if (!meta) {
        logger.warn(`endpoint function input variable has no decorator on index ${index}`)
        continue;

      }
      inputVars[meta.index] = BaseController.getParamVar(req, res, meta, casters, logger)
    }

    return inputVars
  }

  /**
   * Returns the single value of a parameter of a controller method
   * @param {Request} req - the express Request object
   * @param {Response} res - the express Response object
   * @param {EndpointParamMeta} meta - the parameter info of the controller method
   * @param {CasterClass} casters - the Casters
   * @param logger
   * @return {unknown}
   * @private
   */
  private static getParamVar(
    req: Request,
    res: Response,
    meta: EndpointParamMeta,
    casters: DefaultCasters,
    logger: GenericLogger
  ) {
    // if (meta.decorator === 'LOGGER') {
    //   console.log('returning logger', logger)
    //   return logger
    // }
    return meta.actions.getValue(req, res, casters, meta)
  }

  /**
   * Method that calculates the type of http method from the endpoint path
   * @param endpointPath
   * @return {string}
   * @private
   */
  private getMethod(endpointPath: string): REST_METHODS {
    let method = REST_METHODS.POST
    if (endpointPath.includes('get') || endpointPath.includes('list')) method = REST_METHODS.GET
    if (endpointPath.includes('update')) method = REST_METHODS.PATCH
    if (endpointPath.includes('delete')) method = REST_METHODS.DELETE
    if (endpointPath.includes('create')) method = REST_METHODS.POST

    return method
  }

  /**
   * Just prints the endpoints that where created
   * @param endpointsInfo
   * @param controllerName
   * @return {void}
   * @private
   */
  private printEndpointInfo(endpointsInfo: CreatedEndpointInfo[], controllerName: string) {
    const logger = this.getLogger('Endpoint Information')
    const controllerInfo = {
      Controller: controllerName,
      endpoints: [] as unknown[],
    }
    for (const ep of endpointsInfo) {
      controllerInfo.endpoints.push({
        Method: ep.HTTPMethod,
        Function: ep.methodName,
        Path: `${this.mainRoutePath}${ep.path}`,
      })
    }

    logger.info(`Controller: "${controllerName}" Registered`, controllerInfo)
  }
}
