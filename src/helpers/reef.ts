import {readdirSync} from 'fs'
import {join} from 'path'
import 'reflect-metadata'

import {Express, RequestHandler, Request} from 'express'

import {ErrorRequestHandler} from 'express-serve-static-core'

import {
  CasterClass,
  ControllerBundle,
  GenericLogger,
  IMiddlewareGenerator,
  MiddlewareGeneratorClass
} from './aq-base.types'
import {DefaultCasters} from "./default-casters.helper";
import {setLoggerFn} from "../decorators/log.decorator";

/**
 * Class that find and loads the controllers
 */
export class Reef {
  constructor(app: Express) {
    this.app = app
  }

  private readonly app: Express

  private mainRoute = ''

  private CastersClass: CasterClass<any> | undefined

  private preRunList: Array<() => void | Promise<void>> = []

  private controllerBundles: ControllerBundle[] = []

  private globalMiddleware: RequestHandler[] = []

  private middlewareGenerator: IMiddlewareGenerator | undefined

  private errorHandlerFn: ErrorRequestHandler | undefined

  private getTraceIdFunction: ((req: Request) => string) | undefined

  private getLoggerFn: ((funcName: string, path?: string) => GenericLogger) | undefined

  private hideLogsForErrors: string[] = []

  preRun(funcList: () => void | Promise<void>) {
    this.preRunList.push(funcList)
    return this
  }

  setMiddlewareGenerator(MiddlewareGenerator: MiddlewareGeneratorClass) {
    this.middlewareGenerator = new MiddlewareGenerator()
    return this
  }

  /**
   * set the caster functions that will be passed in every controller constructor
   * @param casters
   */
  setCasters(casters: CasterClass<any>) {
    this.CastersClass = casters
    return this
  }

  setControllerBundle(baseRoute: string, controllerDirPath: string, controllerFileNamePattern?: RegExp, onlyTsFiles?: boolean) {
    this.controllerBundles.push({
      baseRoute,
      controllerDirPath,
      controllerFileNamePattern,
      onlyTsFiles: !!onlyTsFiles,
    })
    return this
  }

  setGetTraceIdFunction(getTraceIdFunction: (req: Request) => string) {
    this.getTraceIdFunction = getTraceIdFunction

    return this
  }

  async launch() {
    Error.stackTraceLimit = Infinity
    setLoggerFn(this.getLoggerFn)
    this.globalMiddleware.forEach(m => this.app.use(m))
    const promises = this.preRunList.map(f => f())
    return Promise.all(promises)
      .then(() => this.controllerBundles
        .reduce( // Chain all te loadController promises
          (accPromise, controllerBundle) => {
            return accPromise.then(() => this.loadControllers(controllerBundle))
          },
          Promise.resolve()
        )
      )
      .then(() => {
        if (this.errorHandlerFn) this.app.use(this.errorHandlerFn)
      })
  }

  addGlobalMiddleware(...middleware: RequestHandler[]) {
    this.globalMiddleware.push(...middleware)
    return this
  }

  addErrorHandler(errorHandler: ErrorRequestHandler) {
    this.errorHandlerFn = errorHandler
    return this
  }

  setGetLoggerFn(getLoggerFn: (funcName: string, path?: string) => GenericLogger) {
    this.getLoggerFn = getLoggerFn
    return this
  }

  /**
   * Search files in the given path with the given name pattern and tries to load them as controllers
   * @param {ControllerBundle} controllerBundle
   */
  private loadControllers(controllerBundle: ControllerBundle) {
    const {controllerDirPath, controllerFileNamePattern, onlyTsFiles, baseRoute} = controllerBundle
    const allowedExtRegexp = onlyTsFiles ? /^.+?(\.ts$)/g : /^.+?(\.ts$)|(\.js$)/g
    const files = readdirSync(controllerDirPath)
    const controllerLoadFns = []

    for (const filename of files) {
      // eslint-disable-next-line no-param-reassign
      if (controllerFileNamePattern && controllerFileNamePattern.lastIndex) controllerFileNamePattern.lastIndex = 0
      allowedExtRegexp.lastIndex = 0


      const allowExt = allowedExtRegexp.test(filename)
      if (!allowExt) continue


      if (controllerFileNamePattern && !controllerFileNamePattern.test(filename)) continue


      const filepath = join(controllerDirPath, filename)


      controllerLoadFns.push(() =>
        import(filepath).then(importPayload => {
          const Controller = importPayload.default
          // eslint-disable-next-line no-new
          new Controller(
            this.app,
            baseRoute,
            this.CastersClass ? new this.CastersClass() : new DefaultCasters(),
            this.getTraceIdFunction,
            this.getLoggerFn,
            this.middlewareGenerator,
            this.hideLogsForErrors
          )
        })
      )
    }

    return controllerLoadFns.reduce((accPromise, currPromise) => accPromise.then(currPromise), Promise.resolve()) as Promise<void>
  }
}
